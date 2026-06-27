"use client";

import type { ChatStoreState } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";

export async function fetchRemoteChatStore(
  locale: Locale,
): Promise<ChatStoreState | null> {
  const response = await fetch(
    `/api/user-sessions?locale=${encodeURIComponent(locale)}`,
    { credentials: "include" },
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Failed to load remote chat sessions.");
  }

  const data = (await response.json()) as { store: ChatStoreState | null };
  return data.store ?? null;
}

export async function persistRemoteChatStore(
  store: ChatStoreState,
  locale: Locale,
): Promise<void> {
  const response = await fetch("/api/user-sessions", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale, store }),
  });

  if (!response.ok) {
    throw new Error("Failed to save remote chat sessions.");
  }
}

export async function initializeRemoteChatStore(
  locale: Locale,
): Promise<ChatStoreState | null> {
  const response = await fetch("/api/user-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { store?: ChatStoreState };
  return data.store ?? null;
}