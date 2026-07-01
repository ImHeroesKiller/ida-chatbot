import type { ToolQuotaConfig, ToolQuotaState } from "@/components/chat/tools/types";

/** Default registry quota for Workflow (inactive until admin billing ships). */
export const WORKFLOW_QUOTA_DEFAULTS: ToolQuotaConfig = {
  enabled: false,
  limit: 20,
  resetPeriod: "daily",
};

/** Initial per-session quota counters for the Workflow hook. */
export function createWorkflowQuotaState(): ToolQuotaState {
  return {
    ...WORKFLOW_QUOTA_DEFAULTS,
    used: 0,
  };
}

// TODO: Integrate with admin account management for per-user quota
export const workflowQuota = createWorkflowQuotaState();