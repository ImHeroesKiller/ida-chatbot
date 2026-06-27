import type { Metadata } from "next";

import { LandingPageStatic } from "@/components/landing/landing-page-static";
import { BRAND } from "@/lib/brand";
import { LANDING_COPY } from "@/lib/landing/content";
import {
  getCanonicalUrl,
  getOgImageUrl,
  SEO_KEYWORDS,
  SEO_LOCALES,
} from "@/lib/seo/config";

export const revalidate = 3600;

const landingDescription = `${LANDING_COPY.description} ${SEO_LOCALES.id.description}`;

export const metadata: Metadata = {
  title: BRAND.fullName,
  description: landingDescription,
  keywords: [...SEO_KEYWORDS, "Google OAuth", "AI assistant Indonesia"],
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  openGraph: {
    title: `${LANDING_COPY.headline} ${LANDING_COPY.headlineAccent}`,
    description: landingDescription,
    url: getCanonicalUrl("/"),
    siteName: BRAND.name,
    locale: SEO_LOCALES.id.tag,
    type: "website",
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: BRAND.fullName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${LANDING_COPY.headline} ${LANDING_COPY.headlineAccent}`,
    description: landingDescription,
    images: [getOgImageUrl()],
  },
};

export default function HomePage() {
  return <LandingPageStatic />;
}