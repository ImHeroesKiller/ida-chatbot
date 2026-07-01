import type { WorkflowExecutionLogEntry, WorkflowExecutionResult } from "@/lib/workflow";

export type WorkflowSseEventType = "start" | "progress" | "done" | "error";

export interface WorkflowSseStartPayload {
  workflowId: string;
  startedAt: number;
  totalNodes: number;
}

export interface WorkflowSseProgressPayload {
  log: WorkflowExecutionLogEntry;
  logs: WorkflowExecutionLogEntry[];
}

export interface WorkflowSseDonePayload {
  result: WorkflowExecutionResult;
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