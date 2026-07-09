"use client";

import dynamic from "next/dynamic";

const LandingHeaderActionsWithAuth = dynamic(
  () =>
    import("@/components/landing/landing-header-actions-with-auth").then(
      (mod) => ({
        default: mod.LandingHeaderActionsWithAuth,
      }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-9 w-16 animate-pulse rounded-lg bg-muted sm:w-20" />
        <div className="h-9 w-16 animate-pulse rounded-lg bg-muted sm:w-20" />
      </div>
    ),
  },
);

export function LandingHeaderActionsLazy() {
  return <LandingHeaderActionsWithAuth />;
}