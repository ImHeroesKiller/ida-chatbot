import { Annotation } from "@langchain/langgraph";

import type { ResolvedWorkflowNodeAction } from "@/lib/workflow-actions";
import type { Locale } from "@/lib/config";
import type { WorkflowNode } from "@/lib/workflow";

import type {
  MultiAgentActivity,
  MultiAgentId,
  MultiAgentStepResult,
} from "./types";

export const MultiAgentAnnotation = Annotation.Root({
  locale: Annotation<Locale>,
  node: Annotation<WorkflowNode>,
  action: Annotation<ResolvedWorkflowNodeAction>,
  workflowContext: Annotation<string>,
  prompt: Annotation<string>,
  assignedAgent: Annotation<Exclude<MultiAgentId, "supervisor">>,
  agentDispatched: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  stepComplete: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  activities: Annotation<MultiAgentActivity[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  result: Annotation<MultiAgentStepResult | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

export type MultiAgentGraphState = typeof MultiAgentAnnotation.State;
export type MultiAgentGraphUpdate = typeof MultiAgentAnnotation.Update;

export function createMultiAgentInitialState(input: {
  locale: Locale;
  node: WorkflowNode;
  action: ResolvedWorkflowNodeAction;
  workflowContext: string;
  prompt: string;
  assignedAgent: Exclude<MultiAgentId, "supervisor">;
}): MultiAgentGraphState {
  return {
    locale: input.locale,
    node: input.node,
    action: input.action,
    workflowContext: input.workflowContext,
    prompt: input.prompt,
    assignedAgent: input.assignedAgent,
    agentDispatched: false,
    stepComplete: false,
    activities: [],
    result: null,
    error: null,
  };
}