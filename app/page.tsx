import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const LandingPage = dynamic(
  () =>
    import("@/components/landing/landing-page").then((mod) => ({
      default: mod.LandingPage,
    })),
  {
    loading: () => (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
        <div className="size-16 rounded-2xl bg-muted" />
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted/70" />
        <div className="h-48 w-full max-w-md rounded-xl border bg-muted/20" />
      </div>
    ),
  },
);
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