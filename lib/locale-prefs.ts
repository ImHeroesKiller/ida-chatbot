"use client";

import type { Locale } from "@/lib/config";

export const LOCALE_STORAGE_KEY = "ida-locale";

export function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "id" || stored === "en" || stored === "zh") return stored;
  } catch {
    // ignore
  }
  return null;
}

export function writeStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}