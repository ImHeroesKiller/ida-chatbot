"use client";

import { useCallback, useEffect, useState } from "react";

import {
  applyThemeClass,
  isThemeLocked,
  resolveEffectiveTheme,
} from "@/lib/ui-config/apply-client";
import type { UiTheme } from "@/lib/ui-config/types";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ida-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return null;
}

export function applyTheme(theme: Theme) {
  applyThemeClass(theme);
}

export function resolveTheme(adminTheme: UiTheme = "system"): Theme {
  return resolveEffectiveTheme(adminTheme);
}

export function useTheme(adminTheme: UiTheme = "system") {
  const locked = isThemeLocked(adminTheme);
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const resolved = resolveTheme(adminTheme);
    setThemeState(resolved);
    applyTheme(resolved);
    setHydrated(true);
  }, [adminTheme]);

  useEffect(() => {
    if (locked) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (readStoredTheme()) return;
      const next = getSystemTheme();
      setThemeState(next);
      applyTheme(next);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [locked]);

  const setTheme = useCallback(
    (next: Theme) => {
      if (locked) return;

      setThemeState(next);
      applyTheme(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
    },
    [locked],
  );

  const toggleTheme = useCallback(() => {
    if (locked) return;
    setTheme(theme === "dark" ? "light" : "dark");
  }, [locked, setTheme, theme]);

  return { theme, hydrated, setTheme, toggleTheme, themeLocked: locked };
}