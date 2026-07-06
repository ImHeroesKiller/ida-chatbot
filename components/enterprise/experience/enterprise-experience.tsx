"use client";

import { EnterpriseLocaleProvider } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { EnterpriseProvider } from "./enterprise-context";
import { EnterpriseShell } from "./enterprise-shell";

export function EnterpriseExperience() {
  return (
    <EnterpriseLocaleProvider>
      <EnterpriseProvider>
        <EnterpriseShell />
      </EnterpriseProvider>
    </EnterpriseLocaleProvider>
  );
}