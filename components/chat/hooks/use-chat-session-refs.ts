"use client";

import { useCallback, useRef } from "react";

import type { ChatSession } from "@/lib/chat-store";

export function useChatSessionRefs(currentChat: ChatSession | null) {
  const activeChatIdRef = useRef<string | null>(null);
  const localStateChatIdRef = useRef<string | null>(null);

  const canPersistCurrentChatState = useCallback(() => {
    if (!currentChat) return false;
    if (activeChatIdRef.current === "__pending__") return false;
    return localStateChatIdRef.current === currentChat.id;
  }, [currentChat]);

  const markChatSwitchPending = useCallback(() => {
    activeChatIdRef.current = "__pending__";
    localStateChatIdRef.current = null;
  }, []);

  const markChatActive = useCallback((chatId: string) => {
    activeChatIdRef.current = chatId;
    localStateChatIdRef.current = chatId;
  }, []);

  return {
    activeChatIdRef,
    localStateChatIdRef,
    canPersistCurrentChatState,
    markChatSwitchPending,
    markChatActive,
  };
}

export type ChatSessionRefs = ReturnType<typeof useChatSessionRefs>;