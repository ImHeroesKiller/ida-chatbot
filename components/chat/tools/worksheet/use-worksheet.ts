"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { ToolQuotaState } from "@/components/chat/tools/types";
import type { Locale } from "@/lib/config";
import type {
  WorksheetDocument,
  WorksheetErrorCode,
  WorksheetVersionSource,
} from "@/lib/worksheet";
import {
  addGeneratedWorksheetDocument,
  createEmptyWorksheetWorkspace,
  getWorksheetDocumentById,
  normalizeWorksheetDocument,
  recordWorksheetDocumentVersion,
  removeWorksheetDocument,
  setActiveWorksheetDocument,
  setWorksheetWorkspaceError,
  syncWorkspaceLegacyFields,
  updateWorksheetDocument,
  type WorksheetSavedDocument,
} from "@/lib/worksheet-workspace";

import { createWorksheetQuotaState } from "./worksheet-quota";

const PANEL_ID = TOOL_PANEL_IDS.worksheet;
const DEFAULT_LOCALE: Locale = "id";

/** Re-export core worksheet types used across the tool and panel. */
export type {
  WorksheetDocument,
  WorksheetErrorCode,
  WorksheetVersion,
  WorksheetVersionSource,
} from "@/lib/worksheet";

export type {
  WorksheetDocumentListFilters,
  WorksheetDocumentStatus,
  WorksheetExportFormat,
  WorksheetSavedDocument,
} from "@/lib/worksheet-workspace";

/** Workspace snapshot persisted on `ChatSession.worksheet`. */
export type WorksheetWorkspaceState = WorksheetDocument;

export interface WorksheetCreateDocumentInput {
  title: string;
  content: string;
  promptSummary?: string;
  /** When true (default), the new document becomes active. */
  activate?: boolean;
}

/** Payload from SSE stream when a worksheet document is generated. */
export interface WorksheetStreamDocumentInput {
  title: string;
  content: string;
  promptSummary?: string;
  /** Stream inserts default to list view (`activate: false`). */
  activate?: boolean;
}

export type WorksheetUpdateDocumentPatch = Partial<
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
>;

export interface WorksheetRecordDocumentVersionInput {
  title: string;
  content: string;
  source: WorksheetVersionSource;
}

export interface WorksheetSaveDocumentChangesInput {
  title?: string;
  content?: string;
}

type PersistLayerSync = (workspace: WorksheetWorkspaceState) => void;

export interface WorksheetHydrationInput extends ToolHydrationInput {
  workspace?: WorksheetDocument | null;
  locale?: Locale;
  isGenerating?: boolean;
  errorDetail?: string | null;
}

export type WorksheetTool = BaseToolState &
  BaseToolLifecycle<WorksheetHydrationInput> & {
    quota: ToolQuotaState;
    locale: Locale;
    workspace: WorksheetWorkspaceState;
    documents: WorksheetSavedDocument[];
    activeDocumentId: string | null;
    isGenerating: boolean;
    /** Transient stream/API error detail shown below the mapped error code. */
    errorDetail: string | null;
    setLocale: (locale: Locale) => void;
    getWorkspace: () => WorksheetWorkspaceState;
    setWorkspace: (workspace: WorksheetWorkspaceState) => void;
    updateWorkspace: (patch: Partial<WorksheetWorkspaceState>) => void;
    /** Hydrate runtime workspace from an external snapshot (persist layer / chat). */
    hydrateFromExternal: (workspace: WorksheetWorkspaceState) => WorksheetWorkspaceState;
    /** @deprecated Use `hydrateFromExternal` — kept for Phase 3 fallback callers. */
    syncWorkspaceFromExternal: (workspace: WorksheetWorkspaceState) => void;
    /** Mirror the current (or provided) workspace snapshot into the persist layer. */
    syncToPersistLayer: (
      workspace?: WorksheetWorkspaceState,
    ) => WorksheetWorkspaceState;
    registerSyncToPersistLayer: (sync: PersistLayerSync | null) => void;
    setDocuments: (documents: WorksheetSavedDocument[]) => void;
    setActiveDocumentId: (documentId: string | null) => void;
    setIsGenerating: (generating: boolean) => void;
    setGenerating: (generating: boolean) => void;
    createDocument: (input: WorksheetCreateDocumentInput) => WorksheetSavedDocument | null;
    /** Append a chat-stream generated document to the workspace runtime state. */
    createDocumentFromStream: (
      input: WorksheetStreamDocumentInput,
    ) => WorksheetWorkspaceState | null;
    /** Alias for stream/regenerate completion — appends or activates per `activate`. */
    regenerateDocumentFromStream: (
      input: WorksheetStreamDocumentInput,
    ) => WorksheetWorkspaceState | null;
    /** Prepare UI/runtime state before a chat regenerate send. */
    beginRegenerate: () => void;
    setErrorDetail: (message: string | null) => void;
    clearErrorDetail: () => void;
    getErrorDetail: () => string | null;
    /** Apply worksheet error from SSE stream (`worksheetError` or `generate_failed`). */
    applyStreamError: (
      errorCode: WorksheetErrorCode,
      message?: string | null,
    ) => WorksheetWorkspaceState;
    updateDocument: (
      documentId: string,
      patch: WorksheetUpdateDocumentPatch,
    ) => WorksheetWorkspaceState;
    recordDocumentVersion: (
      documentId: string,
      input: WorksheetRecordDocumentVersionInput,
    ) => WorksheetWorkspaceState;
    /** Save title/content and append a manual_save version entry. */
    saveDocumentChanges: (
      documentId: string,
      changes: WorksheetSaveDocumentChangesInput,
    ) => WorksheetWorkspaceState | null;
    selectDocument: (documentId: string) => void;
    deleteDocument: (documentId: string) => void;
    resetWorkspace: () => void;
  };

function applyWorkspaceState(
  prev: WorksheetWorkspaceState,
  next: WorksheetWorkspaceState | Partial<WorksheetWorkspaceState>,
): WorksheetWorkspaceState {
  return syncWorkspaceLegacyFields({
    ...prev,
    ...next,
  });
}

/**
 * Worksheet tool hook — `BaseToolState` + workspace primitives.
 *
 * `useWorksheetWorkspace` still owns persistence side-effects during Phase 3;
 * workspace mutations are mirrored here via `syncWorkspaceFromExternal`.
 */
export function useWorksheet(): WorksheetTool {
  const [quota, setQuota] = useState<ToolQuotaState>(createWorksheetQuotaState);
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const localeRef = useRef<Locale>(DEFAULT_LOCALE);
  const [workspace, setWorkspaceInternal] = useState<WorksheetWorkspaceState>(
    () => createEmptyWorksheetWorkspace(DEFAULT_LOCALE),
  );
  const workspaceRef = useRef(workspace);
  const [isGenerating, setIsGeneratingState] = useState(false);
  const [errorDetail, setErrorDetailState] = useState<string | null>(null);
  const errorDetailRef = useRef<string | null>(null);
  const persistSyncRef = useRef<PersistLayerSync | null>(null);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    errorDetailRef.current = errorDetail;
  }, [errorDetail]);

  const setErrorDetail = useCallback((message: string | null) => {
    errorDetailRef.current = message;
    setErrorDetailState(message);
  }, []);

  const clearErrorDetail = useCallback(() => {
    errorDetailRef.current = null;
    setErrorDetailState(null);
  }, []);

  const getErrorDetail = useCallback(() => errorDetailRef.current, []);

  const setLocale = useCallback((next: Locale) => {
    localeRef.current = next;
    setLocaleState(next);
  }, []);

  const setWorkspace = useCallback((next: WorksheetWorkspaceState) => {
    const synced = syncWorkspaceLegacyFields(next);
    workspaceRef.current = synced;
    setWorkspaceInternal(synced);
  }, []);

  const getWorkspace = useCallback(() => workspaceRef.current, []);

  const updateWorkspace = useCallback((patch: Partial<WorksheetWorkspaceState>) => {
    setWorkspaceInternal((prev) => {
      const synced = applyWorkspaceState(prev, patch);
      workspaceRef.current = synced;
      return synced;
    });
  }, []);

  const hydrateFromExternal = useCallback(
    (external: WorksheetWorkspaceState): WorksheetWorkspaceState => {
      const normalized = normalizeWorksheetDocument(
        external,
        localeRef.current,
      );
      setWorkspace(normalized);
      return normalized;
    },
    [setWorkspace],
  );

  const syncWorkspaceFromExternal = hydrateFromExternal;

  const registerSyncToPersistLayer = useCallback(
    (sync: PersistLayerSync | null) => {
      persistSyncRef.current = sync;
    },
    [],
  );

  const syncToPersistLayer = useCallback(
    (nextWorkspace?: WorksheetWorkspaceState): WorksheetWorkspaceState => {
      const snapshot = syncWorkspaceLegacyFields({
        ...(nextWorkspace ?? workspaceRef.current),
        updatedAt: Date.now(),
      });
      persistSyncRef.current?.(snapshot);
      return snapshot;
    },
    [],
  );

  const setDocuments = useCallback((documents: WorksheetSavedDocument[]) => {
    updateWorkspace({ documents });
  }, [updateWorkspace]);

  const setActiveDocumentId = useCallback((documentId: string | null) => {
    updateWorkspace({ activeDocumentId: documentId });
  }, [updateWorkspace]);

  const setIsGenerating = useCallback((generating: boolean) => {
    setIsGeneratingState(generating);
  }, []);

  const setGenerating = setIsGenerating;

  const resetQuota = useCallback(() => {
    setQuota(createWorksheetQuotaState());
  }, []);

  const resetWorkspace = useCallback(() => {
    const empty = normalizeWorksheetDocument(
      createEmptyWorksheetWorkspace(localeRef.current),
      localeRef.current,
    );
    workspaceRef.current = empty;
    setWorkspaceInternal(empty);
    setIsGeneratingState(false);
    clearErrorDetail();
  }, [clearErrorDetail]);

  const hydrateWorkspaceState = useCallback((state: WorksheetHydrationInput) => {
    if (state.locale) {
      setLocale(state.locale);
    }

    if (state.workspace !== undefined) {
      const normalized = normalizeWorksheetDocument(
        state.workspace,
        localeRef.current,
      );
      workspaceRef.current = normalized;
      setWorkspaceInternal(normalized);
    }

    if (state.isGenerating !== undefined) {
      setIsGeneratingState(state.isGenerating);
    }

    if (state.errorDetail !== undefined) {
      setErrorDetail(state.errorDetail);
    } else if (state.workspace !== undefined) {
      setErrorDetail(null);
    }
  }, [setErrorDetail, setLocale]);

  const {
    panelId,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate: hydrateBase,
    resetForNewChat: resetBaseForNewChat,
  } = useBaseToolState<WorksheetHydrationInput>(PANEL_ID, {
    onReset: () => {
      resetQuota();
      resetWorkspace();
    },
  });

  const hydrate = useCallback(
    (state: WorksheetHydrationInput) => {
      hydrateBase(state);
      hydrateWorkspaceState(state);
    },
    [hydrateBase, hydrateWorkspaceState],
  );

  const resetForNewChat = useCallback(() => {
    resetBaseForNewChat();
  }, [resetBaseForNewChat]);

  const createDocument = useCallback(
    (input: WorksheetCreateDocumentInput): WorksheetSavedDocument | null => {
      const trimmedContent = input.content.trim();
      if (!trimmedContent) return null;

      let created: WorksheetSavedDocument | null = null;

      setWorkspaceInternal((prev) => {
        const next = addGeneratedWorksheetDocument(
          prev,
          {
            title: input.title,
            content: input.content,
            promptSummary: input.promptSummary,
          },
          { activate: input.activate !== false },
        );
        const synced = syncWorkspaceLegacyFields(next);
        workspaceRef.current = synced;
        const activeId = synced.activeDocumentId;
        created =
          synced.documents?.find((doc) => doc.id === activeId) ??
          synced.documents?.[0] ??
          null;
        return synced;
      });

      return created;
    },
    [],
  );

  const beginRegenerate = useCallback(() => {
    setIsGeneratingState(true);
    clearErrorDetail();
    updateWorkspace({ error: undefined });
  }, [clearErrorDetail, updateWorkspace]);

  const createDocumentFromStream = useCallback(
    (input: WorksheetStreamDocumentInput): WorksheetWorkspaceState | null => {
      const trimmedContent = input.content.trim();
      if (!trimmedContent) return null;

      let nextWorkspace!: WorksheetWorkspaceState;

      setWorkspaceInternal((prev) => {
        const appended = addGeneratedWorksheetDocument(
          prev,
          {
            title: input.title,
            content: input.content,
            promptSummary: input.promptSummary,
          },
          { activate: input.activate ?? false },
        );
        nextWorkspace = syncWorkspaceLegacyFields({
          ...appended,
          updatedAt: Date.now(),
          error: undefined,
        });
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      setIsGeneratingState(false);
      clearErrorDetail();
      return nextWorkspace;
    },
    [clearErrorDetail],
  );

  const regenerateDocumentFromStream = createDocumentFromStream;

  const applyStreamError = useCallback(
    (
      errorCode: WorksheetErrorCode,
      message?: string | null,
    ): WorksheetWorkspaceState => {
      let nextWorkspace!: WorksheetWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = syncWorkspaceLegacyFields(
          setWorksheetWorkspaceError(prev, errorCode, localeRef.current),
        );
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });
      setIsGeneratingState(false);
      setErrorDetail(message ?? null);

      return nextWorkspace;
    },
    [setErrorDetail],
  );

  const updateDocument = useCallback(
    (
      documentId: string,
      patch: WorksheetUpdateDocumentPatch,
    ): WorksheetWorkspaceState => {
      let nextWorkspace!: WorksheetWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = syncWorkspaceLegacyFields(
          updateWorksheetDocument(prev, documentId, patch),
        );
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
    },
    [syncToPersistLayer],
  );

  const recordDocumentVersion = useCallback(
    (
      documentId: string,
      input: WorksheetRecordDocumentVersionInput,
    ): WorksheetWorkspaceState => {
      let nextWorkspace!: WorksheetWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = syncWorkspaceLegacyFields(
          recordWorksheetDocumentVersion(prev, documentId, input),
        );
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
    },
    [syncToPersistLayer],
  );

  const saveDocumentChanges = useCallback(
    (
      documentId: string,
      changes: WorksheetSaveDocumentChangesInput,
    ): WorksheetWorkspaceState | null => {
      const current = getWorksheetDocumentById(workspaceRef.current, documentId);
      if (!current) return null;

      const nextTitle = changes.title ?? current.title;
      const nextContent = changes.content ?? current.content;
      if (!nextContent.trim()) return null;

      return recordDocumentVersion(documentId, {
        title: nextTitle,
        content: nextContent,
        source: "manual_save",
      });
    },
    [recordDocumentVersion],
  );

  const selectDocument = useCallback((documentId: string) => {
    setWorkspaceInternal((prev) => {
      const synced = syncWorkspaceLegacyFields(
        setActiveWorksheetDocument(prev, documentId),
      );
      workspaceRef.current = synced;
      return synced;
    });
  }, []);

  const deleteDocument = useCallback((documentId: string) => {
    setWorkspaceInternal((prev) => {
      const synced = syncWorkspaceLegacyFields(
        removeWorksheetDocument(prev, documentId, localeRef.current),
      );
      workspaceRef.current = synced;
      return synced;
    });
  }, []);

  const documents = useMemo(
    () => workspace.documents ?? [],
    [workspace.documents],
  );

  const activeDocumentId = workspace.activeDocumentId ?? null;
  const quotaSnapshot = useMemo(() => ({ ...quota }), [quota]);
  const workspaceSnapshot = useMemo(
    () => ({ ...workspace, documents }),
    [documents, workspace],
  );

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    quota: quotaSnapshot,
    locale,
    workspace: workspaceSnapshot,
    documents,
    activeDocumentId,
    isGenerating,
    errorDetail,
    setLocale,
    getWorkspace,
    setWorkspace,
    updateWorkspace,
    hydrateFromExternal,
    syncWorkspaceFromExternal,
    syncToPersistLayer,
    registerSyncToPersistLayer,
    setDocuments,
    setActiveDocumentId,
    setIsGenerating,
    setGenerating,
    createDocument,
    createDocumentFromStream,
    regenerateDocumentFromStream,
    beginRegenerate,
    setErrorDetail,
    clearErrorDetail,
    getErrorDetail,
    applyStreamError,
    updateDocument,
    recordDocumentVersion,
    saveDocumentChanges,
    selectDocument,
    deleteDocument,
    resetWorkspace,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  };
}