import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { persistRunState } from "./checkpointer";
import type { AgentGraphNodeId, AgentWorkflowRun } from "./types";

const AgentStateAnnotation = Annotation.Root({
  run: Annotation<AgentWorkflowRun>,
});

type AgentGraphState = typeof AgentStateAnnotation.State;

async function checkpointNode(
  state: AgentGraphState,
  node: AgentGraphNodeId,
): Promise<Partial<AgentGraphState>> {
  const run = { ...state.run, currentNode: node, updatedAt: Date.now() };
  await persistRunState(run);
  return { run };
}

function buildOrchestratorGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode("user_input", (state) => checkpointNode(state, "user_input"))
    .addNode("llm_analysis", (state) => checkpointNode(state, "llm_analysis"))
    .addNode("propose_workflow", (state) =>
      checkpointNode(state, "propose_workflow"),
    )
    .addNode("user_approve", (state) => checkpointNode(state, "user_approve"))
    .addNode("request_templates", (state) =>
      checkpointNode(state, "request_templates"),
    )
    .addNode("upload_templates", (state) =>
      checkpointNode(state, "upload_templates"),
    )
    .addNode("validate_inject", (state) =>
      checkpointNode(state, "validate_inject"),
    )
    .addNode("sandbox_execute", (state) =>
      checkpointNode(state, "sandbox_execute"),
    )
    .addNode("doc_playwright", (state) =>
      checkpointNode(state, "doc_playwright"),
    )
    .addNode("branch_leadtime", (state) =>
      checkpointNode(state, "branch_leadtime"),
    )
    .addNode("generate_artifacts", (state) =>
      checkpointNode(state, "generate_artifacts"),
    )
    .addNode("notify_audit", (state) => checkpointNode(state, "notify_audit"))
    .addNode("workflow_complete", (state) =>
      checkpointNode(state, "workflow_complete"),
    )
    .addEdge(START, "user_input")
    .addEdge("user_input", "llm_analysis")
    .addEdge("llm_analysis", "propose_workflow")
    .addEdge("propose_workflow", "user_approve")
    .addEdge("user_approve", "request_templates")
    .addEdge("request_templates", "upload_templates")
    .addEdge("upload_templates", "validate_inject")
    .addEdge("validate_inject", "sandbox_execute")
    .addEdge("sandbox_execute", "doc_playwright")
    .addEdge("doc_playwright", "branch_leadtime")
    .addEdge("branch_leadtime", "generate_artifacts")
    .addEdge("generate_artifacts", "notify_audit")
    .addEdge("notify_audit", "workflow_complete")
    .addEdge("workflow_complete", END);

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildOrchestratorGraph> | null = null;

export function getAgentOrchestrator() {
  if (!compiledGraph) {
    compiledGraph = buildOrchestratorGraph();
  }
  return compiledGraph;
}

/** Advance LangGraph state to a target node (prototype — full invoke on execute). */
export async function syncOrchestratorNode(
  run: AgentWorkflowRun,
  targetNode: AgentGraphNodeId,
): Promise<AgentWorkflowRun> {
  await persistRunState({ ...run, currentNode: targetNode });
  return { ...run, currentNode: targetNode, updatedAt: Date.now() };
}