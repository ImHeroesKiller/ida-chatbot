import type { ResolvedWorkflowNodeAction } from "@/lib/workflow-actions";
import type { WorkflowExecutionCheckpoint } from "@/lib/workflow-execution-state";
import type { WorkflowExecutionLogEntry, WorkflowExecutionResult } from "@/lib/workflow";

export type WorkflowSseEventType =
  | "start"
  | "progress"
  | "tool_action"
  | "approval_required"
  | "recovery_required"
  | "scheduled"
  | "done"
  | "error";

export interface WorkflowSseStartPayload {
  workflowId: string;
  startedAt: number;
  totalNodes: number;
}

export interface WorkflowSseProgressPayload {
  log: WorkflowExecutionLogEntry;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowSseToolActionPayload {
  nodeId: string;
  action: ResolvedWorkflowNodeAction;
  dispatch?: Record<string, string>;
  output: string;
  message: string;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowSseApprovalRequiredPayload {
  checkpoint: WorkflowExecutionCheckpoint;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowSseRecoveryRequiredPayload {
  checkpoint: WorkflowExecutionCheckpoint;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowSseScheduledPayload {
  nextRunAt: number;
  label: string;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowSseDonePayload {
  result: WorkflowExecutionResult;
  checkpoint?: WorkflowExecutionCheckpoint | null;
}

export interface WorkflowSseErrorPayload {
  error: string;
  result?: WorkflowExecutionResult;
}

export function formatWorkflowSseEvent(
  event: WorkflowSseEventType,
  data: unknown,
): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function createWorkflowExecuteSseStream(
  handler: (
    send: (event: WorkflowSseEventType, data: unknown) => void,
  ) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: WorkflowSseEventType, data: unknown) => {
        controller.enqueue(encoder.encode(formatWorkflowSseEvent(event, data)));
      };

      try {
        await handler(send);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Workflow execution failed.";
        controller.enqueue(
          encoder.encode(
            formatWorkflowSseEvent("error", {
              error: message,
            } satisfies WorkflowSseErrorPayload),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
}

export function workflowExecuteSseResponse(
  stream: ReadableStream<Uint8Array>,
): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}