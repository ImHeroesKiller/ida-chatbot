"use client";

import dynamic from "next/dynamic";

import { useDeferredReady } from "@/lib/client/use-deferred-ready";

const WebVitalsReporter = dynamic(
  () =>
    import("@/components/performance/web-vitals-reporter").then(
      (mod) => mod.WebVitalsReporter,
    ),
  { ssr: false },
);

export function DeferredWebVitals() {
  const ready = useDeferredReady({
    minDelay: 1500,
    idleTimeout: 3000,
    afterWindowLoad: true,
  });

  if (!ready) return null;

  return <WebVitalsReporter />;
}