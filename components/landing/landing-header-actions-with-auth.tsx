"use client";

import { Suspense } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingHeaderActions } from "@/components/landing/landing-header-actions";

export function LandingHeaderActionsWithAuth() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted sm:w-28" />
        }
      >
        <LandingHeaderActions />
      </Suspense>
    </AuthProvider>
  );
}