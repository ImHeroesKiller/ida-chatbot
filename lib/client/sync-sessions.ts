"use client";

import type { ChatStoreState } from "@/lib/chat-store";
import { isValidAnonymousUserId } from "@/lib/user-id";
import type { Locale } from "@/lib/config";

export async function fetchRemoteChatStore(
  userId: string,
  locale: Locale,
): Promise<ChatStoreState | null> {
  if (!isValidAnonymousUserId(userId)) return null;

  const response = await fetch(
    `/api/user-sessions?userId=${encodeURIComponent(userId)}&locale=${locale}`,
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Failed to load remote chat sessions.");
  }

  const data = (await response.json()) as { store: ChatStoreState | null };
  return data.store ?? null;
}

export async function persistRemoteChatStore(
  userId: string,
  store: ChatStoreState,
  locale: Locale,
): Promise<void> {
  if (!isValidAnonymousUserId(userId)) return;

  const response = await fetch("/api/user-sessions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, locale, store }),
  });

  if (!response.ok) {
    throw new Error("Failed to save remote chat sessions.");
  }
}