import { BRAND } from "@/lib/brand";
import { LANDING_COPY } from "@/lib/landing/content";

import { getCanonicalUrl, getOgImageUrl, SEO_LOCALES } from "./config";

export const LANDING_SEO_KEYWORDS = [
  "IDA",
  "Intelligent Digital Assistant",
  "AI Assistant Indonesia",
  "Asisten AI",
  "Asisten AI Indonesia",
  "AI Agent Indonesia",
  "chatbot Indonesia",
  "Worksheet AI",
  "AI Worksheet",
  "Web Search AI",
  "AI Research",
  "chat AI gratis",
  "asisten digital",
  "productivity AI",
  "AI untuk produktivitas",
] as const;

export const LANDING_SEO_TITLE =
  "IDA — Asisten AI Indonesia | Chat, Worksheet, Web Search & Research";

export const LANDING_SEO_DESCRIPTION =
  "IDA adalah asisten AI buatan Indonesia untuk chat, Worksheet, Web Search, Research, dan Map. Gratis dicoba — mulai chat dan selesaikan tugas lebih cepat.";

export function getLandingOpenGraphTitle(): string {
  return `${LANDING_COPY.headline} — ${LANDING_COPY.headlineAccent}`;
}

export function buildLandingPageMetadata() {
  const description = `${LANDING_SEO_DESCRIPTION} ${SEO_LOCALES.id.description}`;
  const ogTitle = getLandingOpenGraphTitle();
  const canonical = getCanonicalUrl("/");
  const ogImage = getOgImageUrl();

  return {
    title: LANDING_SEO_TITLE,
    description,
    keywords: [...LANDING_SEO_KEYWORDS],
    alternates: {
      canonical,
      languages: {
        id: canonical,
        en: `${canonical}?lang=en`,
        "x-default": canonical,
      },
    },
    openGraph: {
      title: ogTitle,
      description: LANDING_SEO_DESCRIPTION,
      url: canonical,
      siteName: BRAND.name,
      locale: SEO_LOCALES.id.tag,
      alternateLocale: [SEO_LOCALES.en.tag],
      type: "website" as const,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${BRAND.name} — Asisten AI Indonesia dengan Worksheet, Web Search, dan Research`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: ogTitle,
      description: LANDING_SEO_DESCRIPTION,
      images: [
        {
          url: ogImage,
          alt: `${BRAND.name} — Asisten AI Indonesia`,
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
        "max-image-preview": "large" as const,
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}