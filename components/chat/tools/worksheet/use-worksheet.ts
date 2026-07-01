"use client";

import { useCallback, useMemo, useRef, useState } from "react";

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
    setWorkspace: (workspace: WorksheetWorkspaceState) => void;
    setIsGenerating: (generating: boolean) => void;
    createDocument: (input: WorksheetCreateDocumentInput) => WorksheetSavedDocument | null;
    selectDocument: (documentId: string) => void;
    deleteDocument: (documentId: string) => void;
    resetWorkspace: () => void;
  };

/**
 * Worksheet tool hook — `BaseToolState` + workspace primitives.
 *
 * Document editing, export, and persistence still flow through
 * `useWorksheetWorkspace` / `worksheet-panel.tsx` during Phase 3 migration.
 */
export function useWorksheet(): WorksheetTool {
  const [quota, setQuota] = useState<ToolQuotaState>(createWorksheetQuotaState);
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const localeRef = useRef<Locale>(DEFAULT_LOCALE);
  const [workspace, setWorkspaceInternal] = useState<WorksheetWorkspaceState>(
    () => createEmptyWorksheetWorkspace(DEFAULT_LOCALE),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const setLocale = useCallback((next: Locale) => {
    localeRef.current = next;
    setLocaleState(next);
  }, []);

  const setWorkspace = useCallback((next: WorksheetWorkspaceState) => {
    setWorkspaceInternal(syncWorkspaceLegacyFields(next));
  }, []);

  const resetQuota = useCallback(() => {
    setQuota(createWorksheetQuotaState());
  }, []);

  const resetWorkspace = useCallback(() => {
    const empty = normalizeWorksheetDocument(
      createEmptyWorksheetWorkspace(localeRef.current),
      localeRef.current,
    );
    setWorkspaceInternal(empty);
    setIsGenerating(false);
  }, []);

  const hydrateWorkspaceState = useCallback((state: WorksheetHydrationInput) => {
    if (state.locale) {
      setLocale(state.locale);
    }

    if (state.workspace !== undefined) {
      setWorkspaceInternal(
        normalizeWorksheetDocument(state.workspace, localeRef.current),
      );
    }

    if (state.isGenerating !== undefined) {
      setIsGenerating(state.isGenerating);
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

  const selectDocument = useCallback((documentId: string) => {
    setWorkspaceInternal((prev) =>
      syncWorkspaceLegacyFields(setActiveWorksheetDocument(prev, documentId)),
    );
  }, []);

  const deleteDocument = useCallback((documentId: string) => {
    setWorkspaceInternal((prev) =>
      syncWorkspaceLegacyFields(
        removeWorksheetDocument(prev, documentId, localeRef.current),
      ),
    );
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
    setWorkspace,
    setIsGenerating,
    createDocument,
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