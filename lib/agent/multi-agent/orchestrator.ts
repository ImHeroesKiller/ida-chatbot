import { getWorkflowNodePrompt } from "@/lib/workflow";
import { resolveWorkflowNodeAction } from "@/lib/workflow-actions";

import { getMultiAgentGraph } from "./graph";
import { createMultiAgentInitialState } from "./state";
import type {
  MultiAgentActivity,
  MultiAgentStepInput,
  MultiAgentStepResult,
} from "./types";
import { resolveAgentForWorkflowNode } from "./types";

export type MultiAgentProgressEvent =
  | { type: "activity"; activity: MultiAgentActivity; activities: MultiAgentActivity[] }
  | { type: "done"; result: MultiAgentStepResult };

/**
 * Run a single workflow canvas step through the LangGraph multi-agent system.
 * Yields agent activity events for SSE / UI streaming.
 */
export async function* runMultiAgentWorkflowStep(
  input: MultiAgentStepInput,
): AsyncGenerator<MultiAgentProgressEvent, MultiAgentStepResult> {
  const assignedAgent = resolveAgentForWorkflowNode(input.node, input.action);
  const graph = getMultiAgentGraph();
  const initialState = createMultiAgentInitialState({
    locale: input.locale,
    node: input.node,
    action: input.action,
    workflowContext: input.workflowContext,
    prompt: input.prompt,
    assignedAgent,
  });

  const seenActivityIds = new Set<string>();
  let latestActivities: MultiAgentActivity[] = [];
  let finalResult: MultiAgentStepResult | null = null;

  const stream = await graph.stream(initialState, { streamMode: "updates" });

  for await (const chunk of stream) {
    for (const update of Object.values(chunk)) {
      const partial = update as {
        activities?: MultiAgentActivity[];
        result?: MultiAgentStepResult | null;
      };

      if (partial.activities?.length) {
        for (const activity of partial.activities) {
          if (seenActivityIds.has(activity.id)) continue;
          seenActivityIds.add(activity.id);
          latestActivities = [...latestActivities, activity];
          yield {
            type: "activity",
            activity,
            activities: [...latestActivities],
          };
        }
      }

      if (partial.result) {
        finalResult = {
          ...partial.result,
          activities: partial.result.activities.length
            ? partial.result.activities
            : latestActivities,
        };
      }
    }
  }

  if (!finalResult) {
    finalResult = {
      success: false,
      output: "",
      message: "Multi-agent step returned no result.",
      activities: latestActivities,
      assignedAgent,
    };
  }

  yield { type: "done", result: finalResult };
  return finalResult;
}

/** Convenience wrapper used by workflow-executor. */
export async function executeMultiAgentWorkflowStep(
  input: Omit<MultiAgentStepInput, "prompt"> & { prompt?: string },
): Promise<MultiAgentStepResult> {
  const prompt = input.prompt?.trim() || getWorkflowNodePrompt(input.node);
  let result: MultiAgentStepResult | null = null;

  for await (const event of runMultiAgentWorkflowStep({
    ...input,
    prompt,
    action:
      input.action ??
      resolveWorkflowNodeAction(input.node, input.workflowContext),
  })) {
    if (event.type === "done") {
      result = event.result;
    }
  }

  return (
    result ?? {
      success: false,
      output: "",
      message: "Multi-agent execution failed.",
      activities: [],
      assignedAgent: resolveAgentForWorkflowNode(
        input.node,
        input.action ??
          resolveWorkflowNodeAction(input.node, input.workflowContext),
      ),
    }
  );
}