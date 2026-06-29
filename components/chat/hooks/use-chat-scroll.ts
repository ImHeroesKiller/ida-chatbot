"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { IdaMessage } from "@/lib/types";

interface UseChatScrollOptions {
  messages: IdaMessage[];
  isLoading: boolean;
  hydrated: boolean;
  currentChatId: string | undefined;
}

export function useChatScroll({
  messages,
  isLoading,
  hydrated,
  currentChatId,
}: UseChatScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(isLoading ? "auto" : "smooth");
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollButton(distanceFromBottom > 120);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hydrated, currentChatId]);

  return {
    scrollContainerRef,
    messagesEndRef,
    showScrollButton,
    scrollToBottom,
  };
}