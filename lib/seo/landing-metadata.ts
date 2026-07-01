import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BRAND } from "@/lib/brand";
import type { Locale } from "@/lib/config";

import {
  getOgImageUrl,
  SEO_LOCALES,
} from "./config";
import { buildLanguageAlternates, getLocalizedCanonicalUrl } from "./locale-path";

export async function buildLocalizedLandingMetadata(
  locale: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Seo" });
  const landing = await getTranslations({ locale, namespace: "Landing" });

  const description = t("description");
  const ogTitle = t("ogTitle");
  const canonical = getLocalizedCanonicalUrl("/", locale);
  const ogImage = getOgImageUrl();
  const localeTag =
    SEO_LOCALES[locale as Locale]?.tag ?? SEO_LOCALES.id.tag;
  const alternateLocales = Object.values(SEO_LOCALES)
    .map((entry) => entry.tag)
    .filter((tag) => tag !== localeTag);

  return {
    title: t("title"),
    description,
    keywords: t.raw("keywords") as string[],
    alternates: {
      canonical,
      languages: buildLanguageAlternates("/"),
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: BRAND.name,
      locale: localeTag,
      alternateLocale: alternateLocales,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [
        {
          url: ogImage,
          alt: `${BRAND.name} — ${landing("hero.title")}`,
        },
      ],
    },
    category: "technology",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}