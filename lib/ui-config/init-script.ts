import type { IdaUiConfig } from "@/lib/ui-config/types";

export function buildUiInitScript(config: IdaUiConfig): string {
  const serialized = JSON.stringify(config);

  return `
(() => {
  const config = ${serialized};
  const root = document.documentElement;
  const storageKey = 'ida-theme';
  const cacheKey = 'ida-ui-config';

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const readStoredTheme = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return null;
  };

  const resolveTheme = () => {
    if (config.theme === 'light') return 'light';
    if (config.theme === 'dark') return 'dark';
    return readStoredTheme() || getSystemTheme();
  };

  const contrastForeground = (hex) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const channel = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    return luminance > 0.45 ? '#171717' : '#ffffff';
  };

  root.dataset.idaFontSize = config.fontSize;
  root.dataset.idaDensity = config.density;
  root.dataset.idaAnimation = config.animationLevel;
  root.style.setProperty('--ida-message-max-width', config.messageMaxWidth);

  if (config.primaryColor) {
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--primary-foreground', contrastForeground(config.primaryColor));
  }

  root.classList.toggle('dark', resolveTheme() === 'dark');

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(config));
  } catch {}
})();
`.trim();
}