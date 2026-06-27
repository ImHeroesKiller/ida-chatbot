"use client";

import dynamic from "next/dynamic";

import { LandingLoginSkeleton } from "@/components/landing/landing-login-skeleton";

const LandingCtaWithAuth = dynamic(
  () =>
    import("@/components/landing/landing-cta-with-auth").then((mod) => ({
      default: mod.LandingCtaWithAuth,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-muted sm:w-28" />
    ),
  },
);

interface LandingCtaLazyProps {
  variant?: "header" | "hero" | "section";
  className?: string;
}

export function LandingCtaLazy({
  variant = "hero",
  className,
}: LandingCtaLazyProps) {
  return (
    <LandingCtaWithAuth variant={variant} className={className} />
  );
}