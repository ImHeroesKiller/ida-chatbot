"use client";

import { Suspense } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingCtaButton } from "@/components/landing/landing-cta-button";
import { LandingLoginSkeleton } from "@/components/landing/landing-login-skeleton";

interface LandingCtaWithAuthProps {
  variant?: "header" | "hero" | "section";
  className?: string;
}

export function LandingCtaWithAuth({
  variant = "hero",
  className,
}: LandingCtaWithAuthProps) {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          variant === "header" ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted sm:w-28" />
          ) : (
            <LandingLoginSkeleton />
          )
        }
      >
        <LandingCtaButton variant={variant} className={className} />
      </Suspense>
    </AuthProvider>
  );
}