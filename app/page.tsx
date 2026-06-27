import type { Metadata } from "next";
import { Suspense } from "react";

import { LandingPage } from "@/components/landing/landing-page";
import { BRAND } from "@/lib/brand";
import { getCanonicalUrl, SEO_LOCALES } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: BRAND.fullName,
  description: SEO_LOCALES.id.description,
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}