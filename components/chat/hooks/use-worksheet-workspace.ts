"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import toast from "react-hot-toast";

import type { WorksheetWorkspaceState } from "@/components/chat/tools/worksheet/use-worksheet";
import {
  createEmptyWorksheet,
  type ChatSession,
} from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import {
  addGeneratedWorksheetDocument,
  areWorksheetWorkspaceSnapshotsEqual,
  createEmptyWorksheetWorkspace,
  hasWorksheetWorkspaceContent,
  normalizeWorksheetDocument,
  recordWorksheetDocumentVersion,
  syncWorkspaceLegacyFields,
} from "@/lib/worksheet-workspace";
import {
  resolveWorksheetTemplate,
  type WorksheetTemplate,
} from "@/lib/worksheet-templates";

/**
 * Persist layer for `ChatSession.worksheet`.
 *
 * Runtime document mutations should go through `useWorksheet` (tool hook) first;
 * this hook mirrors snapshots via `syncWorkspaceToTool` and auto-persists when
 * workspace state changes. Legacy handlers here remain as fallbacks during Phase 4.
 */
interface UseWorksheetWorkspaceOptions {
  locale: Locale;
  hydrated: boolean;
  currentChat: ChatSession | null;
  canPersistCurrentChatState: () => boolean;
  persistCurrentChat: (patch: Partial<Pick<ChatSession, "worksheet">>) => void;
  worksheetTemplateAppliedLabel: string;
  /** Inbound mirror from persist layer into `useWorksheet` (hydrate snapshots). */
  syncWorkspaceToTool?: (workspace: WorksheetWorkspaceState) => void;
  /** Optional initial workspace snapshot from the tool hook. */
  getWorkspaceFromTool?: () => WorksheetWorkspaceState;
  /** Primary template apply — return true when handled by tool hook. */
  applyTemplateViaTool?: (template: WorksheetTemplate) => boolean;
  /** Primary clear-all — return true when handled by tool hook. */
  clearAllViaTool?: () => boolean;
}

export function useWorksheetWorkspace({
  locale,
  hydrated,
  currentChat,
  canPersistCurrentChatState,
  persistCurrentChat,
  worksheetTemplateAppliedLabel,
  syncWorkspaceToTool,
  getWorkspaceFromTool,
  applyTemplateViaTool,
  clearAllViaTool,
}: UseWorksheetWorkspaceOptions) {
  const [worksheetWorkspace, setWorksheetWorkspaceState] =
    useState<WorksheetWorkspaceState>(() => {
      const fromTool = getWorkspaceFromTool?.();
      if (fromTool && (fromTool.documents?.length ?? 0) > 0) {
        return normalizeWorksheetDocument(fromTool, locale);
      }
      return createEmptyWorksheetWorkspace(locale);
    });
  const worksheetWorkspaceRef = useRef<WorksheetWorkspaceState>(
    createEmptyWorksheetWorkspace(locale),
  );
  const [lastWorksheetPrompt, setLastWorksheetPrompt] = useState("");
  const lastWorksheetPromptRef = useRef("");
  /**
   * Legacy mirror for stream bridge fallback.
   * Runtime SSOT: `tools.worksheet.errorDetail` — do not read for UI.
   */
  const [worksheetErrorDetail, setWorksheetErrorDetail] = useState<
    string | null
  >(null);

  const applyWorkspace = useCallback(
    (next: SetStateAction<WorksheetWorkspaceState>) => {
      setWorksheetWorkspaceState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        const synced = syncWorkspaceLegacyFields(resolved);
        worksheetWorkspaceRef.current = synced;
        syncWorkspaceToTool?.(synced);
        return synced;
      });
    },
    [syncWorkspaceToTool],
  ) as Dispatch<SetStateAction<WorksheetWorkspaceState>>;

  /** Inbound mirror from tool hook — does not echo back to `syncWorkspaceToTool`. */
  const setWorksheetWorkspaceInbound = useCallback(
    (workspace: WorksheetWorkspaceState) => {
      const synced = syncWorkspaceLegacyFields(workspace);
      worksheetWorkspaceRef.current = synced;
      setWorksheetWorkspaceState((prev) => {
        if (areWorksheetWorkspaceSnapshotsEqual(prev, synced)) {
          return prev;
        }
        return synced;
      });
    },
    [],
  );

  useEffect(() => {
    worksheetWorkspaceRef.current = worksheetWorkspace;
  }, [worksheetWorkspace]);

  useEffect(() => {
    lastWorksheetPromptRef.current = lastWorksheetPrompt;
  }, [lastWorksheetPrompt]);

  useEffect(() => {
    if (!hydrated || !currentChat) return;
    if (!canPersistCurrentChatState()) return;

    const worksheet = hasWorksheetWorkspaceContent(worksheetWorkspace)
      ? syncWorkspaceLegacyFields({
          ...worksheetWorkspace,
          updatedAt: Date.now(),
        })
      : createEmptyWorksheet();

    persistCurrentChat({ worksheet });
  }, [
    canPersistCurrentChatState,
    currentChat,
    hydrated,
    persistCurrentChat,
    worksheetWorkspace,
  ]);

  const hydrateFromChat = useCallback(
    (chat: ChatSession) => {
      const worksheet = normalizeWorksheetDocument(chat.worksheet, locale);
      worksheetWorkspaceRef.current = worksheet;
      setWorksheetWorkspaceState(worksheet);
      syncWorkspaceToTool?.(worksheet);
      // Legacy mirror — tool hook clears via hydrateFromExternal + hydrate.
      setWorksheetErrorDetail(null);

      const lastUserMessage = [...chat.messages]
        .reverse()
        .find((message) => message.role === "user");
      setLastWorksheetPrompt(lastUserMessage?.content?.trim() ?? "");
    },
    [locale, syncWorkspaceToTool],
  );

  const resetForNewChat = useCallback(() => {
    const emptyWorksheet = normalizeWorksheetDocument(
      createEmptyWorksheet(),
      locale,
    );
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetWorkspaceState(emptyWorksheet);
    syncWorkspaceToTool?.(emptyWorksheet);
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
  }, [locale, syncWorkspaceToTool]);

  /** Legacy fallback — prefer `tools.worksheet` mutations via panel props. */
  const handleWorksheetChange = useCallback(
    (workspace: WorksheetWorkspaceState) => {
      applyWorkspace(workspace);
    },
    [applyWorkspace],
  );

  const handleWorksheetApplyTemplate = useCallback(
    (template: WorksheetTemplate) => {
      if (applyTemplateViaTool?.(template)) {
        toast.success(worksheetTemplateAppliedLabel);
        return;
      }

      const { title, content } = resolveWorksheetTemplate(template, locale);

      applyWorkspace((prev) => {
        const documentId = prev.activeDocumentId;
        const next = documentId
          ? recordWorksheetDocumentVersion(prev, documentId, {
              title,
              content,
              source: "template",
            })
          : addGeneratedWorksheetDocument(
              prev,
              { title, content },
              { activate: true },
            );
        return syncWorkspaceLegacyFields(next);
      });
      toast.success(worksheetTemplateAppliedLabel);
    },
    [
      applyTemplateViaTool,
      applyWorkspace,
      locale,
      worksheetTemplateAppliedLabel,
    ],
  );

  const handleWorksheetClear = useCallback(() => {
    if (clearAllViaTool?.()) {
      setWorksheetErrorDetail(null);
      setLastWorksheetPrompt("");
      return;
    }

    const emptyWorksheet = normalizeWorksheetDocument(
      createEmptyWorksheet(),
      locale,
    );
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetWorkspaceState(emptyWorksheet);
    syncWorkspaceToTool?.(emptyWorksheet);
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
    persistCurrentChat({ worksheet: createEmptyWorksheet() });
  }, [clearAllViaTool, locale, persistCurrentChat, syncWorkspaceToTool]);

  return {
    worksheetWorkspace,
    setWorksheetWorkspace: applyWorkspace,
    setWorksheetWorkspaceInbound,
    worksheetWorkspaceRef,
    lastWorksheetPrompt,
    setLastWorksheetPrompt,
    lastWorksheetPromptRef,
    worksheetErrorDetail,
    setWorksheetErrorDetail,
    hydrateFromChat,
    resetForNewChat,
    handleWorksheetChange,
    handleWorksheetApplyTemplate,
    handleWorksheetClear,
  };
}