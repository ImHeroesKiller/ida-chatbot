"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { flushSync } from "react-dom";

import type { WorkflowWorkspaceState } from "@/components/chat/tools/use-workflow";
import type { ChatSessionRefs } from "@/components/chat/hooks/use-chat-session-refs";
import type {
  ToolPersistPatch,
  ToolSessionCoordinator,
} from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import type { IdaMessage } from "@/lib/types";
import {
  createEmptyWorkflowWorkspace,
  hasWorkflowWorkspaceContent,
  normalizeWorkflowWorkspace,
} from "@/lib/workflow";

interface UseChatSessionSyncOptions {
  hydrated: boolean;
  currentChat: ChatSession | null;
  sessions: ChatSession[];
  switchChat: (chatId: string) => void;
  createChat: () => string;
  persistCurrentChat: (
    patch: Partial<Pick<ChatSession, "messages">> & ToolPersistPatch,
  ) => void;
  messages: IdaMessage[];
  isLoading: boolean;
  tools: ToolSessionCoordinator;
  sessionRefs: ChatSessionRefs;
  setMessages: Dispatch<SetStateAction<IdaMessage[]>>;
  setInput: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setStreamingMessageId: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setEditingMessageId: Dispatch<SetStateAction<string | null>>;
  hydrateWorksheetFromChat: (chat: ChatSession) => void;
  hydrateWorkflowFromChat?: (chat: ChatSession) => void;
  /** Live workflow mirror — bundled into session persist for remote round-trip. */
  workflowWorkspaceRef?: MutableRefObject<WorkflowWorkspaceState>;
  resetWorksheetForNewChat: () => void;
  resetWorkflowForNewChat?: () => void;
  onAfterSelectChat?: () => void;
  onAfterNewChat?: () => void;
}

export function useChatSessionSync({
  hydrated,
  currentChat,
  sessions,
  switchChat,
  createChat,
  persistCurrentChat,
  messages,
  isLoading,
  tools,
  sessionRefs,
  setMessages,
  setInput,
  setError,
  setStreamingMessageId,
  setIsLoading,
  setEditingMessageId,
  hydrateWorksheetFromChat,
  hydrateWorkflowFromChat,
  workflowWorkspaceRef,
  resetWorksheetForNewChat,
  resetWorkflowForNewChat,
  onAfterSelectChat,
  onAfterNewChat,
}: UseChatSessionSyncOptions) {
  const {
    localStateChatIdRef,
    canPersistCurrentChatState,
    markChatSwitchPending,
    markChatActive,
  } = sessionRefs;

  useLayoutEffect(() => {
    if (!hydrated || !currentChat) return;
    if (localStateChatIdRef.current === currentChat.id) return;

    flushSync(() => {
      setMessages(currentChat.messages);
      setInput("");
      setError(null);
      setStreamingMessageId(null);
      setIsLoading(false);
      setEditingMessageId(null);
      tools.hydrateFromChat(currentChat);
      hydrateWorksheetFromChat(currentChat);
      hydrateWorkflowFromChat?.(currentChat);
    });

    markChatActive(currentChat.id);
  }, [
    currentChat,
    hydrated,
    hydrateWorksheetFromChat,
    hydrateWorkflowFromChat,
    localStateChatIdRef,
    markChatActive,
    setEditingMessageId,
    setError,
    setInput,
    setIsLoading,
    setMessages,
    setStreamingMessageId,
    tools,
    tools.hydrateFromChat,
  ]);

  useEffect(() => {
    if (!hydrated || isLoading || !currentChat) return;
    if (!canPersistCurrentChatState()) return;

    const workflowSnapshot = workflowWorkspaceRef?.current;
    const workflow =
      workflowSnapshot && hasWorkflowWorkspaceContent(workflowSnapshot)
        ? normalizeWorkflowWorkspace({
            ...workflowSnapshot,
            updatedAt: Date.now(),
          })
        : workflowSnapshot
          ? createEmptyWorkflowWorkspace()
          : undefined;

    persistCurrentChat({
      messages,
      ...tools.getPersistPatch(),
      ...(workflow !== undefined ? { workflow } : {}),
    });
  }, [
    currentChat,
    hydrated,
    isLoading,
    messages,
    canPersistCurrentChatState,
    persistCurrentChat,
    workflowWorkspaceRef,
    tools.activePanel,
    tools.getPersistPatch,
    tools.research.researchSessions,
    tools.research.isEnabled,
    tools.webSearch.isEnabled,
    tools.worksheet.isEnabled,
    tools.workflow.isEnabled,
    tools.map.isEnabled,
    tools.map.viewState,
    tools,
  ]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (!sessions.some((session) => session.id === chatId)) return;

      markChatSwitchPending();
      switchChat(chatId);
      onAfterSelectChat?.();
    },
    [markChatSwitchPending, onAfterSelectChat, sessions, switchChat],
  );

  const handleNewChat = useCallback(() => {
    markChatSwitchPending();

    flushSync(() => {
      const newChatId = createChat();

      setMessages([]);
      setInput("");
      setError(null);
      setStreamingMessageId(null);
      setIsLoading(false);
      setEditingMessageId(null);
      tools.resetAllTools();
      resetWorksheetForNewChat();
      resetWorkflowForNewChat?.();
      markChatActive(newChatId);
    });

    onAfterNewChat?.();
  }, [
    createChat,
    markChatActive,
    markChatSwitchPending,
    onAfterNewChat,
    resetWorksheetForNewChat,
    resetWorkflowForNewChat,
    setEditingMessageId,
    setError,
    setInput,
    setIsLoading,
    setMessages,
    setStreamingMessageId,
    tools,
  ]);

  return {
    activeChatIdRef: sessionRefs.activeChatIdRef,
    canPersistCurrentChatState,
    handleSelectChat,
    handleNewChat,
  };
}