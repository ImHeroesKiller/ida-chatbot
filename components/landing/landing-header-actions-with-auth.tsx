"use client";

import { Suspense } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingHeaderActions } from "@/components/landing/landing-header-actions";

export function LandingHeaderActionsWithAuth() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <LandingHeaderActions />
      </Suspense>
    </AuthProvider>
  );
}