import { Annotation } from "@langchain/langgraph";

import type { AgentOrchestrationState, AgentResumePayload, AgentWorkflowRun } from "../types";

/** LangGraph state schema for AgentFlow orchestration (Phase 1). */
export const AgentOrchestrationAnnotation = Annotation.Root({
  run: Annotation<AgentWorkflowRun>,
  resumePayload: Annotation<AgentResumePayload | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  interruptedAt: Annotation<AgentOrchestrationState["interruptedAt"]>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

export type AgentGraphState = typeof AgentOrchestrationAnnotation.State;
export type AgentGraphUpdate = typeof AgentOrchestrationAnnotation.Update;

export function createInitialGraphState(run: AgentWorkflowRun): AgentGraphState {
  return {
    run,
    resumePayload: null,
    interruptedAt: null,
    error: null,
  };
}