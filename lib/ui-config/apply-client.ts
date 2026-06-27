import { contrastForeground, normalizeHexColor } from "@/lib/ui-config/color";
import type { IdaUiConfig, UiTheme } from "@/lib/ui-config/types";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme-prefs";

export const UI_CONFIG_SESSION_KEY = "ida-ui-config";

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

export function resolveEffectiveTheme(adminTheme: UiTheme): Theme {
  if (adminTheme === "light") return "light";
  if (adminTheme === "dark") return "dark";
  return readStoredTheme() ?? getSystemTheme();
}

export function isThemeLocked(adminTheme: UiTheme): boolean {
  return adminTheme === "light" || adminTheme === "dark";
}

export function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function applyUiConfig(config: IdaUiConfig): void {
  const root = document.documentElement;

  root.dataset.idaFontSize = config.fontSize;
  root.dataset.idaDensity = config.density;
  root.dataset.idaAnimation = config.animationLevel;

  root.style.setProperty("--ida-message-max-width", config.messageMaxWidth);

  const primary = normalizeHexColor(config.primaryColor);
  if (primary) {
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", contrastForeground(primary));
  }

  applyThemeClass(resolveEffectiveTheme(config.theme));
}

export function cacheUiConfig(config: IdaUiConfig): void {
  try {
    sessionStorage.setItem(UI_CONFIG_SESSION_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function readCachedUiConfig(): IdaUiConfig | null {
  try {
    const raw = sessionStorage.getItem(UI_CONFIG_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IdaUiConfig;
  } catch {
    return null;
  }
}