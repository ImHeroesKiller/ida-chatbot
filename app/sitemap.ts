import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getSiteUrl, PUBLIC_ROUTES } from "@/lib/seo/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    if (route.path === "/chat") {
      entries.push({
        url: new URL(route.path, siteUrl).toString(),
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
      continue;
    }

    for (const locale of routing.locales) {
      const localizedPath =
        locale === routing.defaultLocale && route.path !== "/"
          ? route.path
          : locale === routing.defaultLocale
            ? "/"
            : route.path === "/"
              ? `/${locale}`
              : `/${locale}${route.path}`;

      entries.push({
        url: new URL(localizedPath, siteUrl).toString(),
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return entries;
}