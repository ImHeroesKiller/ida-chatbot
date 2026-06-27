"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useGlobalUi } from "@/components/global-ui-provider";
import { type Theme, useTheme } from "@/lib/theme-prefs";

interface ThemeContextValue {
  theme: Theme;
  hydrated: boolean;
  themeLocked: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { config } = useGlobalUi();
  const { theme, hydrated, setTheme, toggleTheme, themeLocked } = useTheme(
    config.theme,
  );

  const value = useMemo(
    () => ({ theme, hydrated, themeLocked, setTheme, toggleTheme }),
    [theme, hydrated, themeLocked, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }

  return context;
}