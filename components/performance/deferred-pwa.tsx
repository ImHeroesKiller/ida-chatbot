"use client";

import dynamic from "next/dynamic";

const PwaRoot = dynamic(
  () =>
    import("@/components/seo/pwa-root").then((mod) => ({
      default: mod.PwaRoot,
    })),
  { ssr: false },
);

export function DeferredPwa() {
  return <PwaRoot />;
}