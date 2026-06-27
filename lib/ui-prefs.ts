"use client";

import { useCallback, useEffect, useState } from "react";

export const UI_PREFS_KEY = "ida-ui-prefs";

export interface UiPrefs {
  compactMode: boolean;
}

const DEFAULT_PREFS: UiPrefs = {
  compactMode: false,
};

function readPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: UiPrefs) {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useUiPrefs() {
  const [prefs, setPrefsState] = useState<UiPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefsState(readPrefs());
    setHydrated(true);
  }, []);

  const setPrefs = useCallback((patch: Partial<UiPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      writePrefs(next);
      return next;
    });
  }, []);

  const toggleCompactMode = useCallback(() => {
    setPrefsState((prev) => {
      const next = { ...prev, compactMode: !prev.compactMode };
      writePrefs(next);
      return next;
    });
  }, []);

  return { prefs, hydrated, setPrefs, toggleCompactMode };
}