import type { ToolQuotaConfig, ToolQuotaState } from "@/components/chat/tools/types";

/** Default registry quota for Web Search (inactive until admin billing ships). */
export const WEB_SEARCH_QUOTA_DEFAULTS: ToolQuotaConfig = {
  enabled: false,
  limit: 50,
  resetPeriod: "daily",
};

/** Initial per-session quota counters for the Web Search hook. */
export function createWebSearchQuotaState(): ToolQuotaState {
  return {
    ...WEB_SEARCH_QUOTA_DEFAULTS,
    used: 0,
  };
}