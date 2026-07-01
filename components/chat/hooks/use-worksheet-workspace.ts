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
 * Persists worksheet workspace to `ChatSession` and mirrors mutations into
 * `useWorksheet` via `syncWorkspaceToTool`. Runtime mutations from chat stream
 * should prefer `tools.worksheet.createDocumentFromStream` first.
 */
interface UseWorksheetWorkspaceOptions {
  locale: Locale;
  hydrated: boolean;
  currentChat: ChatSession | null;
  canPersistCurrentChatState: () => boolean;
  persistCurrentChat: (patch: Partial<Pick<ChatSession, "worksheet">>) => void;
  worksheetTemplateAppliedLabel: string;
  /** Mirror workspace mutations into `useWorksheet` during Phase 3 migration. */
  syncWorkspaceToTool?: (workspace: WorksheetWorkspaceState) => void;
  /** Optional initial workspace snapshot from the tool hook. */
  getWorkspaceFromTool?: () => WorksheetWorkspaceState;
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

  const handleWorksheetChange = useCallback(
    (workspace: WorksheetWorkspaceState) => {
      applyWorkspace(workspace);
    },
    [applyWorkspace],
  );

  const handleWorksheetApplyTemplate = useCallback(
    (template: WorksheetTemplate) => {
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
    [applyWorkspace, locale, worksheetTemplateAppliedLabel],
  );

  const handleWorksheetClear = useCallback(() => {
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
  }, [locale, persistCurrentChat, syncWorkspaceToTool]);

  return {
    worksheetWorkspace,
    setWorksheetWorkspace: applyWorkspace,
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