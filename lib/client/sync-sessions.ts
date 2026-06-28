"use client";

import type { ChatStoreState } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";

const DEVICE_ID_HEADER = "x-ida-device-id";

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

export async function fetchDeviceChatStore(
  locale: Locale,
  deviceId: string,
): Promise<ChatStoreState | null> {
  const response = await fetch(
    `/api/device-sessions?locale=${encodeURIComponent(locale)}`,
    {
      headers: {
        [DEVICE_ID_HEADER]: deviceId,
      },
    },
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Failed to load device chat sessions.");
  }

  const data = (await response.json()) as { store: ChatStoreState | null };
  return data.store ?? null;
}

export async function persistDeviceChatStore(
  store: ChatStoreState,
  locale: Locale,
  deviceId: string,
): Promise<void> {
  const response = await fetch("/api/device-sessions", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      [DEVICE_ID_HEADER]: deviceId,
    },
    body: JSON.stringify({ locale, store }),
  });

  if (!response.ok) {
    throw new Error("Failed to save device chat sessions.");
  }
}

export async function initializeDeviceChatStore(
  locale: Locale,
  deviceId: string,
): Promise<ChatStoreState | null> {
  const response = await fetch("/api/device-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [DEVICE_ID_HEADER]: deviceId,
    },
    body: JSON.stringify({ locale }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { store?: ChatStoreState };
  return data.store ?? null;
}