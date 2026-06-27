"use client";

import { PwaInstallPrompt } from "@/components/brand/pwa-install-prompt";

import { ServiceWorkerRegister } from "./service-worker-register";

export function PwaRoot() {
  return (
    <>
      <ServiceWorkerRegister />
      <PwaInstallPrompt />
    </>
  );
}