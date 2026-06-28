"use client";

import { useCallback, useEffect, useState } from "react";

const WEB_SEARCH_PREF_KEY = "ida-web-search-enabled";

export function readWebSearchEnabled(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(WEB_SEARCH_PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeWebSearchEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(WEB_SEARCH_PREF_KEY, enabled ? "true" : "false");
  } catch {
    // ignore quota errors
  }
}

export function useWebSearchPrefs() {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    setEnabledState(readWebSearchEnabled());
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    writeWebSearchEnabled(value);
  }, []);

  return { enabled, setEnabled };
}