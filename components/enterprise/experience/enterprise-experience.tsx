"use client";

import { EnterpriseProvider } from "./enterprise-context";
import { EnterpriseShell } from "./enterprise-shell";

export function EnterpriseExperience() {
  return (
    <EnterpriseProvider>
      <EnterpriseShell />
    </EnterpriseProvider>
  );
}