"use client";

import dynamic from "next/dynamic";

import { useDeferredReady } from "@/lib/client/use-deferred-ready";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => mod.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false },
);

export function DeferredAnalytics() {
  const ready = useDeferredReady({
    minDelay: 2500,
    idleTimeout: 4000,
    afterWindowLoad: true,
  });

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}