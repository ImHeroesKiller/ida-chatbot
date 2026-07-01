import type {
  WorkflowSseDonePayload,
  WorkflowSseErrorPayload,
  WorkflowSseProgressPayload,
  WorkflowSseStartPayload,
} from "@/lib/workflow-sse";
import type { WorkflowExecutionResult } from "@/lib/workflow";

export interface WorkflowExecuteStreamHandlers {
  onStart?: (payload: WorkflowSseStartPayload) => void;
  onProgress?: (payload: WorkflowSseProgressPayload) => void;
  onDone?: (payload: WorkflowSseDonePayload) => void;
}

export async function consumeWorkflowExecuteStream(
  response: Response,
  handlers: WorkflowExecuteStreamHandlers = {},
): Promise<WorkflowExecutionResult> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Streaming response is not supported.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: WorkflowExecutionResult | null = null;
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
      } else if (eventType === "done") {
        const donePayload = payload as WorkflowSseDonePayload;
        result = donePayload.result;
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

  return result;
}