"use client";

import { useMemo, useState } from "react";

import { WELCOME_MESSAGE_ID } from "@/lib/chat-store";
import type { IdaMessage } from "@/lib/types";

export function useChatMessages() {
  const [messages, setMessages] = useState<IdaMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.id !== WELCOME_MESSAGE_ID),
    [messages],
  );

  const hasUserMessages = useMemo(
    () => visibleMessages.some((message) => message.role === "user"),
    [visibleMessages],
  );

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (
        message?.role === "assistant" &&
        message.id !== WELCOME_MESSAGE_ID &&
        message.content.trim()
      ) {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  const lastUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message?.role === "user") {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  return {
    messages,
    setMessages,
    visibleMessages,
    hasUserMessages,
    lastAssistantMessageId,
    lastUserMessageId,
    editingMessageId,
    setEditingMessageId,
  };
}