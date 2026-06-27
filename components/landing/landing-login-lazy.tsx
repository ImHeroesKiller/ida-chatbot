"use client";

import dynamic from "next/dynamic";

import { LandingLoginSkeleton } from "@/components/landing/landing-login-skeleton";

const LandingLoginPanel = dynamic(
  () =>
    import("@/components/landing/landing-login-panel").then((mod) => ({
      default: mod.LandingLoginPanel,
    })),
  { ssr: false, loading: () => <LandingLoginSkeleton /> },
);

export function LandingLoginLazy() {
  return <LandingLoginPanel />;
}