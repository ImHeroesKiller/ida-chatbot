"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingCtaButton } from "@/components/landing/landing-cta-button";
import { LANDING_COPY } from "@/lib/landing/content";
import { COPY } from "@/lib/i18n";

function LoginLegalNote() {
  const copy = COPY.id;
  const searchParams = useSearchParams();
  const authError = searchParams.get("error") === "auth";

  return (
    <div className="space-y-4">
      {authError && (
        <p className="text-center text-sm text-destructive">{copy.authError}</p>
      )}
      <LandingCtaButton variant="section" />
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {copy.loginSubtitle}
      </p>
    </div>
  );
}

export function LandingLoginAuth() {
  return (
    <div className="rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
      <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-muted" />}>
        <LoginLegalNote />
      </Suspense>
      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        {LANDING_COPY.privacyNote}{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          {LANDING_COPY.termsLink}
        </Link>{" "}
        dan{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          {LANDING_COPY.privacyLink}
        </Link>
        .
      </p>
    </div>
  );
}