"use client";

import { useEffect, useState } from "react";

/** Debounce worksheet/workflow mirror writes into chat store. */
export const WORKSPACE_PERSIST_DEBOUNCE_MS = 400;

/** Debounce message + tool-state session sync. */
export const SESSION_SYNC_DEBOUNCE_MS = 350;

/** Debounce sidebar session search input. */
export const SEARCH_DEBOUNCE_MS = 200;

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}