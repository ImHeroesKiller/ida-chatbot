import type {
  WorkflowSseAgentActivityPayload,
  WorkflowSseApprovalRequiredPayload,
  WorkflowSseDonePayload,
  WorkflowSseErrorPayload,
  WorkflowSseProgressPayload,
  WorkflowSseRecoveryRequiredPayload,
  WorkflowSseScheduledPayload,
  WorkflowSseStartPayload,
  WorkflowSseToolActionPayload,
} from "@/lib/workflow-sse";
import type { WorkflowExecutionCheckpoint } from "@/lib/workflow-execution-state";
import type { WorkflowExecutionResult } from "@/lib/workflow";

export interface WorkflowExecuteStreamResult {
  result: WorkflowExecutionResult;
  checkpoint: WorkflowExecutionCheckpoint | null;
}

export interface WorkflowExecuteStreamHandlers {
  onStart?: (payload: WorkflowSseStartPayload) => void;
  onProgress?: (payload: WorkflowSseProgressPayload) => void;
  onAgentActivity?: (payload: WorkflowSseAgentActivityPayload) => void;
  onToolAction?: (payload: WorkflowSseToolActionPayload) => void | Promise<void>;
  onApprovalRequired?: (payload: WorkflowSseApprovalRequiredPayload) => void;
  onRecoveryRequired?: (payload: WorkflowSseRecoveryRequiredPayload) => void;
  onScheduled?: (payload: WorkflowSseScheduledPayload) => void;
  onDone?: (payload: WorkflowSseDonePayload) => void;
}

export async function consumeWorkflowExecuteStream(
  response: Response,
  handlers: WorkflowExecuteStreamHandlers = {},
): Promise<WorkflowExecuteStreamResult> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Streaming response is not supported.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: WorkflowExecutionResult | null = null;
  let checkpoint: WorkflowExecutionCheckpoint | null = null;
  let error: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const lines = block.split("\n");
      let eventType = "message";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim();
        }
      }

      if (!dataLine) continue;

      const payload = JSON.parse(dataLine) as unknown;

      if (eventType === "start") {
        handlers.onStart?.(payload as WorkflowSseStartPayload);
      } else if (eventType === "progress") {
        handlers.onProgress?.(payload as WorkflowSseProgressPayload);
      } else if (eventType === "agent_activity") {
        handlers.onAgentActivity?.(payload as WorkflowSseAgentActivityPayload);
      } else if (eventType === "tool_action") {
        await handlers.onToolAction?.(payload as WorkflowSseToolActionPayload);
      } else if (eventType === "approval_required") {
        handlers.onApprovalRequired?.(payload as WorkflowSseApprovalRequiredPayload);
      } else if (eventType === "recovery_required") {
        handlers.onRecoveryRequired?.(payload as WorkflowSseRecoveryRequiredPayload);
      } else if (eventType === "scheduled") {
        handlers.onScheduled?.(payload as WorkflowSseScheduledPayload);
      } else if (eventType === "done") {
        const donePayload = payload as WorkflowSseDonePayload;
        result = donePayload.result;
        checkpoint = donePayload.checkpoint ?? null;
        handlers.onDone?.(donePayload);
      } else if (eventType === "error") {
        const errorPayload = payload as WorkflowSseErrorPayload;
        error = errorPayload.error;
        if (errorPayload.result) {
          result = errorPayload.result;
        }
      }
    }
  }

  if (!result) {
    throw new Error(error ?? "Workflow execution returned no result.");
  }

  return { result, checkpoint };
}