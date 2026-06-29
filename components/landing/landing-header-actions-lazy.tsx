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
      <div className="h-9 w-24 animate-pulse rounded-lg bg-muted sm:w-28" />
    ),
  },
);

export function LandingHeaderActionsLazy() {
  return <LandingHeaderActionsWithAuth />;
}