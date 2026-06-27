"use client";

import { Suspense } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingLoginAuth } from "@/components/landing/landing-login-auth";
import { LandingLoginSkeleton } from "@/components/landing/landing-login-skeleton";

export function LandingLoginPanel() {
  return (
    <AuthProvider>
      <Suspense fallback={<LandingLoginSkeleton />}>
        <LandingLoginAuth />
      </Suspense>
    </AuthProvider>
  );
}