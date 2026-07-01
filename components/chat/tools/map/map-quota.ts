import type { ToolQuotaConfig, ToolQuotaState } from "@/components/chat/tools/types";

/** Default registry quota for Map (inactive until admin billing ships). */
export const MAP_QUOTA_DEFAULTS: ToolQuotaConfig = {
  enabled: false,
  limit: 30,
  resetPeriod: "daily",
};

/** Initial per-session quota counters for the Map hook. */
export function createMapQuotaState(): ToolQuotaState {
  return {
    ...MAP_QUOTA_DEFAULTS,
    used: 0,
  };
}

// TODO: Integrate with admin account management for per-user quota
export const mapQuota = createMapQuotaState();