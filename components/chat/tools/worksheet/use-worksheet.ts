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
import type { WorksheetDocument } from "@/lib/worksheet";
import {
  addGeneratedWorksheetDocument,
  createEmptyWorksheetWorkspace,
  normalizeWorksheetDocument,
  removeWorksheetDocument,
  setActiveWorksheetDocument,
  syncWorkspaceLegacyFields,
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

export interface WorksheetHydrationInput extends ToolHydrationInput {
  workspace?: WorksheetDocument | null;
  locale?: Locale;
  isGenerating?: boolean;
}

export type WorksheetTool = BaseToolState &
  BaseToolLifecycle<WorksheetHydrationInput> & {
    quota: ToolQuotaState;
    locale: Locale;
    workspace: WorksheetWorkspaceState;
    documents: WorksheetSavedDocument[];
    activeDocumentId: string | null;
    isGenerating: boolean;
    setLocale: (locale: Locale) => void;
    getWorkspace: () => WorksheetWorkspaceState;
    setWorkspace: (workspace: WorksheetWorkspaceState) => void;
    updateWorkspace: (patch: Partial<WorksheetWorkspaceState>) => void;
    syncWorkspaceFromExternal: (workspace: WorksheetWorkspaceState) => void;
    setDocuments: (documents: WorksheetSavedDocument[]) => void;
    setActiveDocumentId: (documentId: string | null) => void;
    setIsGenerating: (generating: boolean) => void;
    setGenerating: (generating: boolean) => void;
    createDocument: (input: WorksheetCreateDocumentInput) => WorksheetSavedDocument | null;
    /** Append a chat-stream generated document to the workspace runtime state. */
    createDocumentFromStream: (
      input: WorksheetStreamDocumentInput,
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

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

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

  const syncWorkspaceFromExternal = useCallback((next: WorksheetWorkspaceState) => {
    setWorkspace(next);
  }, [setWorkspace]);

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
  }, []);

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
  }, [setLocale]);

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

      return nextWorkspace;
    },
    [],
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
    setLocale,
    getWorkspace,
    setWorkspace,
    updateWorkspace,
    syncWorkspaceFromExternal,
    setDocuments,
    setActiveDocumentId,
    setIsGenerating,
    setGenerating,
    createDocument,
    createDocumentFromStream,
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