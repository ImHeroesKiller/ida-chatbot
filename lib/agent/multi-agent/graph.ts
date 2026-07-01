import { END, START, StateGraph } from "@langchain/langgraph";

import { buildAgentNode } from "./agents";
import { supervisorNode } from "./supervisor";
import { MultiAgentAnnotation, type MultiAgentGraphState } from "./state";
import type { MultiAgentId } from "./types";

function routeFromSupervisor(state: MultiAgentGraphState): string {
  if (state.stepComplete) return END;
  if (!state.agentDispatched) return state.assignedAgent;
  return END;
}

function buildMultiAgentGraph() {
  const graph = new StateGraph(MultiAgentAnnotation)
    .addNode("supervisor", supervisorNode)
    .addNode("researcher", buildAgentNode("researcher"))
    .addNode("analyst", buildAgentNode("analyst"))
    .addNode("executor", buildAgentNode("executor"))
    .addNode("approver", buildAgentNode("approver"))
    .addNode("documenter", buildAgentNode("documenter"))
    .addEdge(START, "supervisor")
    .addConditionalEdges("supervisor", routeFromSupervisor, {
      researcher: "researcher",
      analyst: "analyst",
      executor: "executor",
      approver: "approver",
      documenter: "documenter",
      [END]: END,
    })
    .addEdge("researcher", "supervisor")
    .addEdge("analyst", "supervisor")
    .addEdge("executor", "supervisor")
    .addEdge("approver", "supervisor")
    .addEdge("documenter", "supervisor");

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildMultiAgentGraph> | null = null;

export function getMultiAgentGraph() {
  if (!compiledGraph) {
    compiledGraph = buildMultiAgentGraph();
  }
  return compiledGraph;
}

export const MULTI_AGENT_GRAPH_NODES: MultiAgentId[] = [
  "supervisor",
  "researcher",
  "analyst",
  "executor",
  "approver",
  "documenter",
];