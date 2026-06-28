"use client";

import { useCallback, useEffect, useState } from "react";

import type { UiFontSize } from "@/lib/ui-config/types";

export type ChatFontSize = UiFontSize;

const CHAT_FONT_SIZE_KEY = "ida-chat-font-size";
const DEFAULT_CHAT_FONT_SIZE: ChatFontSize = "medium";

export function readChatFontSize(): ChatFontSize {
  if (typeof window === "undefined") return DEFAULT_CHAT_FONT_SIZE;

  try {
    const stored = localStorage.getItem(CHAT_FONT_SIZE_KEY);
    if (stored === "small" || stored === "medium" || stored === "large") {
      return stored;
    }
  } catch {
    // ignore
  }

  return DEFAULT_CHAT_FONT_SIZE;
}

export function writeChatFontSize(size: ChatFontSize): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CHAT_FONT_SIZE_KEY, size);
  } catch {
    // ignore
  }
}

export function useChatFontSize() {
  const [fontSize, setFontSizeState] = useState<ChatFontSize>(
    DEFAULT_CHAT_FONT_SIZE,
  );

  useEffect(() => {
    setFontSizeState(readChatFontSize());
  }, []);

  const setFontSize = useCallback((size: ChatFontSize) => {
    setFontSizeState(size);
    writeChatFontSize(size);
  }, []);

  return { fontSize, setFontSize };
}