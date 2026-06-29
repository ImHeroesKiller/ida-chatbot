"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  createEmptyWorksheet,
  type ChatSession,
} from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import {
  type WorksheetDocument,
} from "@/lib/worksheet";
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

interface UseWorksheetWorkspaceOptions {
  locale: Locale;
  hydrated: boolean;
  currentChat: ChatSession | null;
  canPersistCurrentChatState: () => boolean;
  persistCurrentChat: (patch: Partial<Pick<ChatSession, "worksheet">>) => void;
  worksheetTemplateAppliedLabel: string;
}

export function useWorksheetWorkspace({
  locale,
  hydrated,
  currentChat,
  canPersistCurrentChatState,
  persistCurrentChat,
  worksheetTemplateAppliedLabel,
}: UseWorksheetWorkspaceOptions) {
  const [worksheetWorkspace, setWorksheetWorkspace] =
    useState<WorksheetDocument>(() => createEmptyWorksheetWorkspace(locale));
  const worksheetWorkspaceRef = useRef<WorksheetDocument>(
    createEmptyWorksheetWorkspace(locale),
  );
  const [lastWorksheetPrompt, setLastWorksheetPrompt] = useState("");
  const lastWorksheetPromptRef = useRef("");
  const [worksheetErrorDetail, setWorksheetErrorDetail] = useState<
    string | null
  >(null);

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
      setWorksheetWorkspace(worksheet);
      worksheetWorkspaceRef.current = worksheet;
      setWorksheetErrorDetail(null);

      const lastUserMessage = [...chat.messages]
        .reverse()
        .find((message) => message.role === "user");
      setLastWorksheetPrompt(lastUserMessage?.content?.trim() ?? "");
    },
    [locale],
  );

  const resetForNewChat = useCallback(() => {
    const emptyWorksheet = normalizeWorksheetDocument(
      createEmptyWorksheet(),
      locale,
    );
    setWorksheetWorkspace(emptyWorksheet);
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
  }, [locale]);

  const handleWorksheetChange = useCallback((workspace: WorksheetDocument) => {
    setWorksheetWorkspace(workspace);
  }, []);

  const handleWorksheetApplyTemplate = useCallback(
    (template: WorksheetTemplate) => {
      const { title, content } = resolveWorksheetTemplate(template, locale);

      setWorksheetWorkspace((prev) => {
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
    [locale, worksheetTemplateAppliedLabel],
  );

  const handleWorksheetClear = useCallback(() => {
    const emptyWorksheet = normalizeWorksheetDocument(
      createEmptyWorksheet(),
      locale,
    );
    setWorksheetWorkspace(emptyWorksheet);
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
    persistCurrentChat({ worksheet: createEmptyWorksheet() });
  }, [locale, persistCurrentChat]);

  return {
    worksheetWorkspace,
    setWorksheetWorkspace,
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