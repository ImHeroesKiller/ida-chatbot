"use client";

import { isValidAnonymousUserId } from "@/lib/user-id";

export const ANONYMOUS_USER_ID_KEY = "ida-anonymous-user-id";

export { isValidAnonymousUserId };

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getOrCreateAnonymousUserId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
    if (existing && isValidAnonymousUserId(existing)) return existing;

    const next = generateUuid();
    localStorage.setItem(ANONYMOUS_USER_ID_KEY, next);
    return next;
  } catch {
    return generateUuid();
  }
}

export function readAnonymousUserId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
    return existing && isValidAnonymousUserId(existing) ? existing : null;
  } catch {
    return null;
  }
}