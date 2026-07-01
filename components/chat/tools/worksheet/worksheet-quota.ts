import type { ToolQuotaConfig, ToolQuotaState } from "@/components/chat/tools/types";

/** Default registry quota for Worksheet (inactive until admin billing ships). */
export const WORKSHEET_QUOTA_DEFAULTS: ToolQuotaConfig = {
  enabled: false,
  limit: 100,
  resetPeriod: "daily",
};

/** Initial per-session quota counters for the Worksheet hook. */
export function createWorksheetQuotaState(): ToolQuotaState {
  return {
    ...WORKSHEET_QUOTA_DEFAULTS,
    used: 0,
  };
}

// TODO: Integrate with admin account management for per-user quota
export const worksheetQuota = createWorksheetQuotaState();