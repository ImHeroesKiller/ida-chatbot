"use client";

import { useCallback, useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";
import toast from "react-hot-toast";

import type { ChatSession } from "@/lib/chat-store";
import type { ToolPanelHandlerCoordinator } from "@/components/chat/tools/coordinator-types";
import { requestChatComposerFocus } from "@/lib/client/focus-chat-composer";
import type { Locale } from "@/lib/config";
import { formatResearchWorksheetContent } from "@/lib/research-format";
import type { ResearchSession } from "@/lib/research-types";
import type { IdaWebSearchSource } from "@/lib/types";
import type { WorksheetDocument } from "@/lib/worksheet";
import {
  addGeneratedWorksheetDocument,
  summarizeWorksheetPrompt,
  syncWorkspaceLegacyFields,
} from "@/lib/worksheet-workspace";

interface UseChatToolHandlersOptions {
  locale: Locale;
  tools: ToolPanelHandlerCoordinator;
  isLoading: boolean;
  lastWorksheetPrompt: string;
  worksheetWorkspaceRef: RefObject<WorksheetDocument>;
  setWorksheetWorkspace: Dispatch<SetStateAction<WorksheetDocument>>;
  setInput: Dispatch<SetStateAction<string>>;
  persistCurrentChat: (
    patch: Partial<
      Pick<
        ChatSession,
        | "worksheet"
        | "worksheetToolEnabled"
        | "activeRightPanel"
        | "researchSessions"
      >
    >,
  ) => void;
  sendMessage: (text: string) => Promise<void>;
  copy: {
    researchSessionSaved: string;
    worksheetCreated: string;
  };
}

export function useChatToolHandlers({
  locale,
  tools,
  isLoading,
  lastWorksheetPrompt,
  worksheetWorkspaceRef,
  setWorksheetWorkspace,
  setInput,
  persistCurrentChat,
  sendMessage,
  copy,
}: UseChatToolHandlersOptions) {
  const handleWebSearchUseAsContext = useCallback(
    (result: IdaWebSearchSource) => {
      const snippet = `${result.title}\n${result.url}\n${result.snippet}`.trim();
      setInput((prev) => (prev.trim() ? `${prev}\n\n${snippet}` : snippet));
      requestChatComposerFocus();
    },
    [setInput],
  );

  const handleResearchStart = useCallback(
    (topic: string, depth: "quick" | "standard" | "deep") => {
      void tools.research.startResearch(topic, depth, locale);
      tools.openPanel(tools.research.panelId);
    },
    [locale, tools],
  );

  const handleResearchSaveSession = useCallback(() => {
    const saved = tools.research.saveResearchSession();
    if (!saved) return;

    const nextSessions = [
      saved,
      ...tools.research.researchSessions.filter(
        (session) => session.id !== saved.id,
      ),
    ];
    tools.research.setSessions(nextSessions);
    persistCurrentChat({ researchSessions: nextSessions });
    toast.success(copy.researchSessionSaved);
  }, [copy.researchSessionSaved, persistCurrentChat, tools.research]);

  const createWorksheetFromResearch = useCallback(
    (session: ResearchSession) => {
      const content = formatResearchWorksheetContent(session, locale);
      const next = addGeneratedWorksheetDocument(
        worksheetWorkspaceRef.current,
        {
          title: session.topic,
          content,
          promptSummary: summarizeWorksheetPrompt(session.topic),
        },
        { activate: true },
      );
      const persisted = syncWorkspaceLegacyFields({
        ...next,
        updatedAt: Date.now(),
      });

      setWorksheetWorkspace(next);
      tools.activateWorksheet();
      persistCurrentChat({
        worksheet: persisted,
        worksheetToolEnabled: true,
        activeRightPanel: tools.worksheet.panelId,
      });
      toast.success(copy.worksheetCreated);
    },
    [
      copy.worksheetCreated,
      locale,
      persistCurrentChat,
      setWorksheetWorkspace,
      tools,
      worksheetWorkspaceRef,
    ],
  );

  const handleResearchOpenSession = useCallback(
    (session: ResearchSession) => {
      tools.research.applyResearchFromMessage({
        topic: session.topic,
        summary: session.summary,
        sources: session.sources,
        queries: session.queries,
        depth: session.depth,
      });
    },
    [tools.research],
  );

  const handleResearchCreateDocument = useCallback(
    (session: ResearchSession) => {
      createWorksheetFromResearch(session);
    },
    [createWorksheetFromResearch],
  );

  const handleResearchCreateDocumentFromCurrent = useCallback(() => {
    if (!tools.research.currentSession) return;
    createWorksheetFromResearch(tools.research.currentSession);
  }, [createWorksheetFromResearch, tools.research.currentSession]);

  const handleWorksheetRetry = useCallback(() => {
    const prompt = lastWorksheetPrompt.trim();
    if (!prompt || isLoading) return;
    void sendMessage(prompt);
  }, [isLoading, lastWorksheetPrompt, sendMessage]);

  const sharedToolPanelProps = useMemo(
    () => ({
      webSearch: tools.webSearch,
      research: tools.research,
      map: tools.map,
      webSearchSearching:
        isLoading && tools.webSearch.isEnabled && tools.webSearch.isSearching,
      researchSearching:
        tools.research.isResearching ||
        (isLoading &&
          tools.research.isEnabled &&
          !tools.webSearch.isSearching),
      onWebSearchUseAsContext: handleWebSearchUseAsContext,
      onResearchStart: handleResearchStart,
      onResearchSaveSession: handleResearchSaveSession,
      onResearchOpenSession: handleResearchOpenSession,
      onResearchCreateDocument: handleResearchCreateDocument,
      onResearchCreateDocumentFromCurrent:
        handleResearchCreateDocumentFromCurrent,
      onClose: tools.collapsePanel,
    }),
    [
      handleResearchCreateDocument,
      handleResearchCreateDocumentFromCurrent,
      handleResearchOpenSession,
      handleResearchSaveSession,
      handleResearchStart,
      handleWebSearchUseAsContext,
      isLoading,
      tools,
    ],
  );

  return {
    handleWebSearchUseAsContext,
    handleResearchStart,
    handleResearchSaveSession,
    handleResearchOpenSession,
    handleResearchCreateDocument,
    handleResearchCreateDocumentFromCurrent,
    handleWorksheetRetry,
    sharedToolPanelProps,
  };
}