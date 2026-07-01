import type { ToolQuotaConfig, ToolQuotaState } from "@/components/chat/tools/types";

/** Default registry quota for Research (inactive until admin billing ships). */
export const RESEARCH_QUOTA_DEFAULTS: ToolQuotaConfig = {
  enabled: false,
  limit: 20,
  resetPeriod: "daily",
};

/** Initial per-session quota counters for the Research hook. */
export function createResearchQuotaState(): ToolQuotaState {
  return {
    ...RESEARCH_QUOTA_DEFAULTS,
    used: 0,
  };
}

// TODO: Integrate with admin account management for per-user quota
export const researchQuota = createResearchQuotaState();