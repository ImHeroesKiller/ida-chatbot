import type {
  AgentGraphNodeId,
  AgentWorkflowRun,
  AgentWorkflowStatus,
} from "./types";

/**
 * LangGraph-inspired orchestration scaffold for AgentFlow AI.
 * Nodes map to future @langchain/langgraph StateGraph definitions.
 */
export const AGENT_GRAPH_EDGES: Record<AgentGraphNodeId, AgentGraphNodeId[]> = {
  ingest: ["analyze"],
  analyze: ["validate"],
  validate: ["propose"],
  propose: ["approval_gate"],
  approval_gate: ["execute"],
  execute: ["artifact"],
  artifact: [],
};

export const AGENT_GRAPH_NODE_LABELS: Record<AgentGraphNodeId, string> = {
  ingest: "Document Ingest",
  analyze: "Document Analysis",
  validate: "Validation",
  propose: "Workflow Proposal",
  approval_gate: "Human Approval",
  execute: "Sandbox Execution",
  artifact: "Artifact Delivery",
};

export function statusForNode(node: AgentGraphNodeId): AgentWorkflowStatus {
  switch (node) {
    case "ingest":
    case "analyze":
    case "validate":
      return "analyzing";
    case "propose":
      return "proposed";
    case "approval_gate":
      return "awaiting_approval";
    case "execute":
      return "executing";
    case "artifact":
      return "completed";
    default:
      return "draft";
  }
}

export function advanceGraphNode(
  current: AgentGraphNodeId,
): AgentGraphNodeId | null {
  const next = AGENT_GRAPH_EDGES[current]?.[0];
  return next ?? null;
}

export function applyGraphTransition(
  run: AgentWorkflowRun,
  targetNode: AgentGraphNodeId,
): AgentWorkflowRun {
  return {
    ...run,
    currentNode: targetNode,
    status: statusForNode(targetNode),
    updatedAt: Date.now(),
  };
}

export function canExecute(run: AgentWorkflowRun): boolean {
  return (
    run.status === "approved" ||
    (run.status === "awaiting_approval" && run.currentNode === "approval_gate")
  );
}

export function requiresApproval(run: AgentWorkflowRun): boolean {
  return (
    run.currentNode === "approval_gate" ||
    run.status === "proposed" ||
    run.status === "awaiting_approval"
  );
}