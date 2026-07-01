import { routing } from "@/i18n/routing";

import { getCanonicalUrl } from "./config";

export function getLocalizedPath(path: string, locale: string): string {
  if (locale === routing.defaultLocale) {
    return path;
  }

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

export function getLocalizedCanonicalUrl(path: string, locale: string): string {
  return getCanonicalUrl(getLocalizedPath(path, locale));
}

export function buildLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {
    "x-default": getLocalizedCanonicalUrl(path, routing.defaultLocale),
  };

  for (const locale of routing.locales) {
    alternates[locale] = getLocalizedCanonicalUrl(path, locale);
  }

  return alternates;
}