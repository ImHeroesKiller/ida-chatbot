import type { Metadata } from "next";

import { LandingPageStatic } from "@/components/landing/landing-page-static";
import { BRAND } from "@/lib/brand";
import { getCanonicalUrl, SEO_LOCALES } from "@/lib/seo/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: BRAND.fullName,
  description: SEO_LOCALES.id.description,
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
};

export default function HomePage() {
  return <LandingPageStatic />;
}