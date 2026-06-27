"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import { DeferredPwa } from "@/components/performance/deferred-pwa";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DeferredPwa />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          className:
            "!bg-card !text-card-foreground !border !border-border !shadow-lg",
        }}
      />
    </>
  );
}