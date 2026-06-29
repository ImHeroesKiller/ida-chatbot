"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { flushSync } from "react-dom";

import type { ChatSessionRefs } from "@/components/chat/hooks/use-chat-session-refs";
import type {
  ToolPersistPatch,
  ToolSessionCoordinator,
} from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import type { IdaMessage } from "@/lib/types";

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
  resetWorksheetForNewChat: () => void;
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
  resetWorksheetForNewChat,
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
    });

    markChatActive(currentChat.id);
  }, [
    currentChat,
    hydrated,
    hydrateWorksheetFromChat,
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

    persistCurrentChat({
      messages,
      ...tools.getPersistPatch(),
    });
  }, [
    currentChat,
    hydrated,
    isLoading,
    messages,
    canPersistCurrentChatState,
    persistCurrentChat,
    tools.activePanel,
    tools.getPersistPatch,
    tools.research.researchSessions,
    tools.research.isEnabled,
    tools.webSearch.isEnabled,
    tools.worksheet.isEnabled,
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
      tools.resetForNewChat();
      resetWorksheetForNewChat();
      markChatActive(newChatId);
    });

    onAfterNewChat?.();
  }, [
    createChat,
    markChatActive,
    markChatSwitchPending,
    onAfterNewChat,
    resetWorksheetForNewChat,
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