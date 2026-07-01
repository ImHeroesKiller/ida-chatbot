import type { Locale } from "@/lib/config";
import type {
  WorksheetBrandingSource,
  WorksheetLetterheadSelection,
} from "@/lib/worksheet-letterhead-template";
import {
  createWorksheetVersion,
  pushWorksheetVersion,
  type WorksheetDocument,
  type WorksheetErrorCode,
  type WorksheetVersion,
  type WorksheetVersionSource,
} from "@/lib/worksheet";

export type WorksheetDocumentStatus = "generated" | "edited" | "exported";
export type WorksheetExportFormat = "pdf" | "docx";
export type WorksheetDocumentFilterStatus = "all" | WorksheetDocumentStatus;
export type WorksheetDocumentFilterTime = "all" | "today" | "week" | "month";

export interface WorksheetDocumentListFilters {
  status: WorksheetDocumentFilterStatus;
  time: WorksheetDocumentFilterTime;
}

export interface WorksheetDocumentListQuery {
  search: string;
  filters: WorksheetDocumentListFilters;
}

export const DEFAULT_WORKSHEET_DOCUMENT_FILTERS: WorksheetDocumentListFilters =
  {
    status: "all",
    time: "all",
  };

export interface WorksheetSavedDocument {
  id: string;
  title: string;
  content: string;
  promptSummary: string;
  status: WorksheetDocumentStatus;
  createdAt: number;
  updatedAt: number;
  exportedFormats?: WorksheetExportFormat[];
  versions?: WorksheetVersion[];
  brandingSource?: WorksheetBrandingSource;
  letterheadTemplateId?: string | null;
}

const DEFAULT_TITLES: Record<Locale, string> = {
  id: "Dokumen Baru",
  en: "New Document",
  zh: "新文档",
};

function createDocumentId(): string {
  return `wd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function summarizeWorksheetPrompt(prompt: string, maxLength = 96): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

export function summarizeWorksheetContent(content: string, maxLength = 96): string {
  const line =
    content
      .split("\n")
      .map((part) => part.trim())
      .find(Boolean)
      ?.replace(/^#+\s*/, "") ?? "";

  if (!line) return "";
  if (line.length <= maxLength) return line;
  return `${line.slice(0, maxLength - 1)}…`;
}

export function createWorksheetSavedDocument(params: {
  title: string;
  content: string;
  promptSummary?: string;
  status?: WorksheetDocumentStatus;
  versions?: WorksheetVersion[];
  brandingSource?: WorksheetBrandingSource;
  letterheadTemplateId?: string | null;
}): WorksheetSavedDocument {
  const now = Date.now();
  return {
    id: createDocumentId(),
    title: params.title.trim() || "Document",
    content: params.content,
    promptSummary:
      params.promptSummary?.trim() ||
      summarizeWorksheetContent(params.content) ||
      params.title.trim(),
    status: params.status ?? "generated",
    createdAt: now,
    updatedAt: now,
    versions: params.versions,
    brandingSource: params.brandingSource,
    letterheadTemplateId: params.letterheadTemplateId ?? null,
  };
}

export function createEmptyWorksheetWorkspace(locale: Locale): WorksheetDocument {
  return {
    activeDocumentId: null,
    documents: [],
    updatedAt: Date.now(),
    title: DEFAULT_TITLES[locale],
    content: "",
  };
}

/** Normalize legacy single-document worksheet data into multi-document workspace. */
export function normalizeWorksheetDocument(
  raw: WorksheetDocument | null | undefined,
  locale: Locale,
): WorksheetDocument {
  if (!raw) return createEmptyWorksheetWorkspace(locale);

  if (raw.documents && raw.documents.length > 0) {
    return syncWorkspaceLegacyFields({
      ...raw,
      activeDocumentId: raw.activeDocumentId ?? null,
      documents: raw.documents,
      updatedAt: raw.updatedAt ?? Date.now(),
    });
  }

  const hasLegacy =
    Boolean(raw.title?.trim()) ||
    Boolean(raw.content?.trim()) ||
    Boolean(raw.versions?.length) ||
    Boolean(raw.error);

  if (!hasLegacy) {
    return createEmptyWorksheetWorkspace(locale);
  }

  const migrated = createWorksheetSavedDocument({
    title: raw.title?.trim() || DEFAULT_TITLES[locale],
    content: raw.content ?? "",
    promptSummary: summarizeWorksheetContent(raw.content ?? ""),
    status: raw.error ? "generated" : "generated",
    versions: raw.versions,
    brandingSource: raw.brandingSource,
    letterheadTemplateId: raw.letterheadTemplateId,
  });

  return {
    activeDocumentId: migrated.id,
    documents: [migrated],
    title: migrated.title,
    content: migrated.content,
    versions: migrated.versions,
    brandingSource: migrated.brandingSource,
    letterheadTemplateId: migrated.letterheadTemplateId,
    error: raw.error,
    updatedAt: raw.updatedAt ?? Date.now(),
  };
}

export function getActiveWorksheetDocument(
  workspace: WorksheetDocument,
): WorksheetSavedDocument | null {
  if (!workspace.activeDocumentId) return null;
  return (
    workspace.documents?.find((doc) => doc.id === workspace.activeDocumentId) ??
    null
  );
}

export function getWorksheetDocumentById(
  workspace: WorksheetDocument,
  documentId: string,
): WorksheetSavedDocument | null {
  return workspace.documents?.find((doc) => doc.id === documentId) ?? null;
}

export function removeWorksheetDocument(
  workspace: WorksheetDocument,
  documentId: string,
  locale: Locale,
): WorksheetDocument {
  const documents = (workspace.documents ?? []).filter(
    (doc) => doc.id !== documentId,
  );

  if (documents.length === 0) {
    return createEmptyWorksheetWorkspace(locale);
  }

  const wasActive = workspace.activeDocumentId === documentId;
  const nextActiveId = wasActive ? null : workspace.activeDocumentId;

  const next: WorksheetDocument = {
    ...workspace,
    documents,
    activeDocumentId: nextActiveId,
    error: wasActive ? undefined : workspace.error,
    updatedAt: Date.now(),
  };

  if (wasActive) {
    return {
      ...next,
      title: "",
      content: "",
      versions: undefined,
      brandingSource: undefined,
      letterheadTemplateId: undefined,
    };
  }

  return syncWorkspaceLegacyFields(next);
}

export function setActiveWorksheetDocument(
  workspace: WorksheetDocument,
  documentId: string | null,
): WorksheetDocument {
  const active = documentId
    ? getWorksheetDocumentById(workspace, documentId)
    : null;

  return {
    ...workspace,
    activeDocumentId: documentId,
    title: active?.title ?? workspace.title,
    content: active?.content ?? workspace.content,
    versions: active?.versions,
    brandingSource: active?.brandingSource,
    letterheadTemplateId: active?.letterheadTemplateId,
    updatedAt: Date.now(),
  };
}

export function addGeneratedWorksheetDocument(
  workspace: WorksheetDocument,
  params: {
    title: string;
    content: string;
    promptSummary?: string;
    versions?: WorksheetVersion[];
  },
  options?: { activate?: boolean },
): WorksheetDocument {
  const versions =
    params.versions ??
    pushWorksheetVersion(
      undefined,
      createWorksheetVersion({
        title: params.title,
        content: params.content,
        source: "generated",
      }),
    );

  const document = createWorksheetSavedDocument({
    title: params.title,
    content: params.content,
    promptSummary: params.promptSummary,
    status: "generated",
    versions,
  });

  const documents = [document, ...(workspace.documents ?? [])];
  const activate = options?.activate !== false;

  return {
    ...workspace,
    documents,
    activeDocumentId: activate ? document.id : workspace.activeDocumentId,
    title: activate ? document.title : workspace.title,
    content: activate ? document.content : workspace.content,
    versions: activate ? document.versions : workspace.versions,
    error: undefined,
    updatedAt: Date.now(),
  };
}

export function updateWorksheetDocument(
  workspace: WorksheetDocument,
  documentId: string,
  patch: Partial<
    Pick<
      WorksheetSavedDocument,
      | "title"
      | "content"
      | "promptSummary"
      | "status"
      | "exportedFormats"
      | "versions"
      | "brandingSource"
      | "letterheadTemplateId"
    >
  >,
): WorksheetDocument {
  const documents = (workspace.documents ?? []).map((doc) => {
    if (doc.id !== documentId) return doc;
    return {
      ...doc,
      ...patch,
      updatedAt: Date.now(),
    };
  });

  const active = workspace.activeDocumentId === documentId
    ? documents.find((doc) => doc.id === documentId)
    : getActiveWorksheetDocument(workspace);

  return {
    ...workspace,
    documents,
    title: active?.title ?? workspace.title,
    content: active?.content ?? workspace.content,
    versions: active?.versions ?? workspace.versions,
    brandingSource: active?.brandingSource ?? workspace.brandingSource,
    letterheadTemplateId:
      active?.letterheadTemplateId ?? workspace.letterheadTemplateId,
    updatedAt: Date.now(),
  };
}

export function recordWorksheetDocumentVersion(
  workspace: WorksheetDocument,
  documentId: string,
  params: {
    title: string;
    content: string;
    source: WorksheetVersionSource;
  },
): WorksheetDocument {
  const target = getWorksheetDocumentById(workspace, documentId);
  if (!target) return workspace;

  const versions = pushWorksheetVersion(
    target.versions,
    createWorksheetVersion(params),
  );

  return updateWorksheetDocument(workspace, documentId, {
    title: params.title,
    content: params.content,
    versions,
    status: params.source === "generated" ? "generated" : "edited",
  });
}

export function getWorksheetLetterheadSelection(
  workspace: WorksheetDocument,
  documentId?: string | null,
): WorksheetLetterheadSelection {
  const doc = documentId
    ? getWorksheetDocumentById(workspace, documentId)
    : getActiveWorksheetDocument(workspace);

  return {
    brandingSource: doc?.brandingSource ?? workspace.brandingSource ?? "personal",
    letterheadTemplateId:
      doc?.letterheadTemplateId ?? workspace.letterheadTemplateId ?? null,
  };
}

export function setWorksheetLetterheadSelection(
  workspace: WorksheetDocument,
  selection: WorksheetLetterheadSelection,
  documentId?: string | null,
): WorksheetDocument {
  const targetId = documentId ?? workspace.activeDocumentId;
  if (targetId) {
    return updateWorksheetDocument(workspace, targetId, {
      brandingSource: selection.brandingSource,
      letterheadTemplateId: selection.letterheadTemplateId,
    });
  }

  return {
    ...workspace,
    brandingSource: selection.brandingSource,
    letterheadTemplateId: selection.letterheadTemplateId,
    updatedAt: Date.now(),
  };
}

export function countWorksheetWords(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\-\[\]`]/g, " ")
    .trim();

  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function getDefaultTemplateNameFromTitle(title: string): string {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (!normalized) return "Template";
  return normalized.slice(0, 120);
}

function matchesWorksheetTimeFilter(
  timestamp: number,
  time: WorksheetDocumentFilterTime,
): boolean {
  if (time === "all") return true;

  const now = Date.now();
  const date = new Date(timestamp);

  if (time === "today") {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  if (time === "week") {
    return timestamp >= now - 7 * 24 * 60 * 60 * 1000;
  }

  if (time === "month") {
    const current = new Date();
    return (
      date.getMonth() === current.getMonth() &&
      date.getFullYear() === current.getFullYear()
    );
  }

  return true;
}

export function filterWorksheetDocuments(
  documents: WorksheetSavedDocument[],
  query: WorksheetDocumentListQuery,
): WorksheetSavedDocument[] {
  const search = query.search.trim().toLowerCase();

  return documents.filter((document) => {
    if (
      query.filters.status !== "all" &&
      document.status !== query.filters.status
    ) {
      return false;
    }

    const referenceTime = Math.max(document.updatedAt, document.createdAt);
    if (!matchesWorksheetTimeFilter(referenceTime, query.filters.time)) {
      return false;
    }

    if (!search) return true;

    const haystack = [
      document.title,
      document.promptSummary,
      document.content,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function markWorksheetDocumentExported(
  workspace: WorksheetDocument,
  documentId: string,
  format: WorksheetExportFormat,
): WorksheetDocument {
  const target = getWorksheetDocumentById(workspace, documentId);
  if (!target) return workspace;

  const exportedFormats = Array.from(
    new Set([...(target.exportedFormats ?? []), format]),
  );

  return updateWorksheetDocument(workspace, documentId, {
    status: "exported",
    exportedFormats,
  });
}

export function formatWorksheetDocumentDate(
  timestamp: number,
  locale: Locale,
  options?: { short?: boolean },
): string {
  return new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID",
    options?.short
      ? { dateStyle: "short", timeStyle: "short" }
      : { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(timestamp));
}

export function formatWorksheetWordCount(count: number, locale: Locale): string {
  const labels: Record<Locale, string> = {
    id: `${count.toLocaleString("id-ID")} kata`,
    en: `${count.toLocaleString("en-US")} words`,
    zh: `${count.toLocaleString("zh-CN")} 字`,
  };
  return labels[locale];
}

export function worksheetStatusLabel(
  status: WorksheetDocumentStatus,
  locale: Locale,
): string {
  const labels: Record<Locale, Record<WorksheetDocumentStatus, string>> = {
    id: {
      generated: "Generated",
      edited: "Edited",
      exported: "Exported",
    },
    en: {
      generated: "Generated",
      edited: "Edited",
      exported: "Exported",
    },
    zh: {
      generated: "已生成",
      edited: "已编辑",
      exported: "已导出",
    },
  };
  return labels[locale][status];
}

export function syncWorkspaceLegacyFields(
  workspace: WorksheetDocument,
): WorksheetDocument {
  const active = getActiveWorksheetDocument(workspace);
  if (!active) {
    return {
      ...workspace,
      title: workspace.title ?? "",
      content: workspace.content ?? "",
    };
  }

  return {
    ...workspace,
    title: active.title,
    content: active.content,
    versions: active.versions,
    brandingSource: active.brandingSource,
    letterheadTemplateId: active.letterheadTemplateId,
  };
}

export function hasWorksheetWorkspaceContent(
  workspace: WorksheetDocument,
): boolean {
  return Boolean(
    workspace.documents?.length ||
      workspace.content?.trim() ||
      workspace.versions?.length ||
      workspace.error,
  );
}

export function setWorksheetWorkspaceError(
  workspace: WorksheetDocument,
  error: WorksheetErrorCode,
  locale: Locale,
): WorksheetDocument {
  const active = getActiveWorksheetDocument(workspace);
  return {
    ...normalizeWorksheetDocument(workspace, locale),
    error,
    title: active?.title ?? workspace.title ?? DEFAULT_TITLES[locale],
    content: active?.content ?? workspace.content ?? "",
    updatedAt: Date.now(),
  };
}

/** Stable content fingerprint for loop-safe tool ↔ persist sync (excludes `updatedAt`). */
export function buildWorksheetWorkspacePersistFingerprint(
  workspace: WorksheetDocument,
): string {
  return JSON.stringify({
    activeDocumentId: workspace.activeDocumentId ?? null,
    error: workspace.error ?? null,
    brandingSource: workspace.brandingSource ?? null,
    letterheadTemplateId: workspace.letterheadTemplateId ?? null,
    documents: (workspace.documents ?? []).map((document) => ({
      id: document.id,
      title: document.title,
      content: document.content,
      status: document.status,
      promptSummary: document.promptSummary,
      exportedFormats: document.exportedFormats ?? [],
      brandingSource: document.brandingSource ?? null,
      letterheadTemplateId: document.letterheadTemplateId ?? null,
      versionsLength: document.versions?.length ?? 0,
    })),
  });
}

export function areWorksheetWorkspaceSnapshotsEqual(
  left: WorksheetDocument,
  right: WorksheetDocument,
): boolean {
  return (
    buildWorksheetWorkspacePersistFingerprint(left) ===
    buildWorksheetWorkspacePersistFingerprint(right)
  );
}