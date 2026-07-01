import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorkflowErrorCode } from "@/lib/workflow";

export function resolveWorkflowErrorMessage(
  locale: Locale,
  options?: {
    code?: WorkflowErrorCode | string | null;
    message?: string | null;
    httpStatus?: number;
  },
): string {
  const copy = COPY[locale];

  if (options?.httpStatus === 429) {
    return copy.workflowRateLimitExceeded;
  }

  if (options?.message?.trim()) {
    const normalized = options.message.trim().toLowerCase();
    if (normalized.includes("rate limit")) {
      return copy.workflowRateLimitExceeded;
    }
    if (
      normalized.includes("network") ||
      normalized.includes("fetch") ||
      normalized.includes("failed to fetch")
    ) {
      return copy.workflowNetworkError;
    }
    return options.message.trim();
  }

  switch (options?.code) {
    case "parse_failed":
      return copy.workflowErrorParseFailed;
    case "empty_workflow":
      return copy.workflowErrorEmptyWorkflow;
    case "execute_failed":
      return copy.workflowExecuteFailed;
    default:
      return copy.workflowExecuteFailed;
  }
}

export function resolveWorkflowExecutionToast(
  locale: Locale,
  status: string,
  message?: string | null,
): { type: "success" | "error" | "info"; text: string } {
  const copy = COPY[locale];

  if (status === "completed") {
    return {
      type: "success",
      text: message?.trim() || copy.workflowExecuted,
    };
  }
  if (status === "awaiting_approval") {
    return { type: "info", text: copy.workflowApprovalRequired };
  }
  if (status === "paused") {
    return { type: "error", text: copy.workflowRecoveryRequired };
  }
  return {
    type: "error",
    text: resolveWorkflowErrorMessage(locale, {
      code: "execute_failed",
      message,
    }),
  };
}