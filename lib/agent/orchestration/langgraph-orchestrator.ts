import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { executeInE2bSandbox, isE2bConfigured } from "../sandbox/e2b-executor";
import type {
  AgentGraphNodeId,
  AgentResumePayload,
  AgentWorkflowRun,
} from "../types";
import { applyGraphTransition, INTERRUPT_NODES } from "./graph";
import {
  attachTemplatesToRun,
  nodeLlmAnalysis,
  nodeProposeWorkflow,
  nodeRequestTemplates,
  nodeUploadTemplates,
  nodeUserInput,
  nodeValidateInject,
} from "./nodes";
import {
  AgentOrchestrationAnnotation,
  createInitialGraphState,
  type AgentGraphState,
} from "./state";

const memorySaver = new MemorySaver();

function nodeUserApprove(state: AgentGraphState): Partial<AgentGraphState> {
  const payload = state.resumePayload;
  const action =
    payload?.gate === "workflow_approval" ? payload.action : "cancel";

  if (action === "cancel") {
    return {
      run: {
        ...state.run,
        status: "cancelled",
        currentNode: "user_approve",
        updatedAt: Date.now(),
      },
      resumePayload: null,
    };
  }

  if (action === "edit") {
    return {
      run: applyGraphTransition(state.run, "propose_workflow"),
      resumePayload: null,
    };
  }

  return {
    run: applyGraphTransition(state.run, "request_templates"),
    resumePayload: null,
  };
}

function nodeExecutionApprove(state: AgentGraphState): Partial<AgentGraphState> {
  const payload = state.resumePayload;
  const action =
    payload?.gate === "execution_approval" ? payload.action : "cancel";

  if (action === "cancel") {
    return {
      run: {
        ...state.run,
        status: "cancelled",
        currentNode: "execution_approve",
        updatedAt: Date.now(),
      },
      resumePayload: null,
    };
  }

  return {
    run: applyGraphTransition(state.run, "sandbox_execute"),
    resumePayload: null,
  };
}

async function nodeSandboxExecute(
  state: AgentGraphState,
): Promise<Partial<AgentGraphState>> {
  let run = applyGraphTransition(state.run, "sandbox_execute");
  const { executionSteps, sandboxSession } = await executeInE2bSandbox(run);
  run = {
    ...run,
    sandboxSession,
    executionSteps,
    status: "executing",
    updatedAt: Date.now(),
  };
  return { run };
}

function passthroughNode(node: AgentGraphNodeId) {
  return (state: AgentGraphState): Partial<AgentGraphState> => ({
    run: applyGraphTransition(state.run, node),
  });
}

function routeAfterUserApprove(state: AgentGraphState): string {
  if (state.run.status === "cancelled") return END;
  if (state.run.currentNode === "propose_workflow") return "propose_workflow";
  return "request_templates";
}

function routeAfterExecutionApprove(state: AgentGraphState): string {
  if (state.run.status === "cancelled") return END;
  return "sandbox_execute";
}

function buildOrchestratorGraph() {
  return new StateGraph(AgentOrchestrationAnnotation)
    .addNode("user_input", nodeUserInput)
    .addNode("llm_analysis", nodeLlmAnalysis)
    .addNode("propose_workflow", nodeProposeWorkflow)
    .addNode("user_approve", nodeUserApprove)
    .addNode("request_templates", nodeRequestTemplates)
    .addNode("upload_templates", nodeUploadTemplates)
    .addNode("validate_inject", nodeValidateInject)
    .addNode("execution_approve", nodeExecutionApprove)
    .addNode("sandbox_execute", nodeSandboxExecute)
    .addNode("doc_playwright", passthroughNode("doc_playwright"))
    .addNode("branch_leadtime", passthroughNode("branch_leadtime"))
    .addNode("generate_artifacts", passthroughNode("generate_artifacts"))
    .addNode("notify_audit", passthroughNode("notify_audit"))
    .addNode("workflow_complete", passthroughNode("workflow_complete"))
    .addEdge(START, "user_input")
    .addEdge("user_input", "llm_analysis")
    .addEdge("llm_analysis", "propose_workflow")
    .addEdge("propose_workflow", "user_approve")
    .addConditionalEdges("user_approve", routeAfterUserApprove, {
      request_templates: "request_templates",
      propose_workflow: "propose_workflow",
      [END]: END,
    })
    .addEdge("request_templates", END)
    .addEdge("upload_templates", "validate_inject")
    .addEdge("validate_inject", "execution_approve")
    .addConditionalEdges("execution_approve", routeAfterExecutionApprove, {
      sandbox_execute: "sandbox_execute",
      [END]: END,
    })
    .addEdge("sandbox_execute", "doc_playwright")
    .addEdge("doc_playwright", "branch_leadtime")
    .addEdge("branch_leadtime", "generate_artifacts")
    .addEdge("generate_artifacts", "notify_audit")
    .addEdge("notify_audit", "workflow_complete")
    .addEdge("workflow_complete", END)
    .compile({
      checkpointer: memorySaver,
      interruptBefore: [...INTERRUPT_NODES],
    });
}

let compiledGraph: ReturnType<typeof buildOrchestratorGraph> | null = null;

export function getAgentOrchestrator() {
  if (!compiledGraph) {
    compiledGraph = buildOrchestratorGraph();
  }
  return compiledGraph;
}

function threadConfig(runId: string) {
  return { configurable: { thread_id: runId } };
}

export async function invokePlanningGraph(
  run: AgentWorkflowRun,
): Promise<AgentGraphState> {
  const graph = getAgentOrchestrator();
  const result = await graph.invoke(createInitialGraphState(run), threadConfig(run.id));
  return result as AgentGraphState;
}

export async function resumePlanningGraph(
  runId: string,
  resume: AgentResumePayload,
  run: AgentWorkflowRun,
): Promise<AgentGraphState> {
  const graph = getAgentOrchestrator();
  const input = { ...createInitialGraphState(run), resumePayload: resume };

  const result = await graph.invoke(input, threadConfig(runId));
  return result as AgentGraphState;
}

export async function invokeTemplatePhase(
  run: AgentWorkflowRun,
): Promise<AgentGraphState> {
  const graph = getAgentOrchestrator();
  const state = createInitialGraphState(
    applyGraphTransition(run, "upload_templates"),
  );
  const result = await graph.invoke(state, threadConfig(run.id));
  return result as AgentGraphState;
}

export async function resumeExecutionGraph(
  runId: string,
  run: AgentWorkflowRun,
  resume: AgentResumePayload,
): Promise<AgentGraphState> {
  const graph = getAgentOrchestrator();
  const state: AgentGraphState = {
    ...createInitialGraphState(run),
    resumePayload: resume,
  };

  const result = await graph.invoke(state, threadConfig(runId));
  return result as AgentGraphState;
}

export function isGraphInterruptedAt(
  run: AgentWorkflowRun,
  node: AgentGraphNodeId,
): boolean {
  return run.interruptedAt === node || run.currentNode === node;
}

export { isE2bConfigured };