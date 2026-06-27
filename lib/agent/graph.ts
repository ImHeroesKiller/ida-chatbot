import type {
  AgentGraphNodeId,
  AgentWorkflowRun,
  AgentWorkflowStatus,
} from "./types";

/** LangGraph node edges aligned with AgentFlow AI Technical Specification v1.0 §5 & §8 */
export const AGENT_GRAPH_EDGES: Record<AgentGraphNodeId, AgentGraphNodeId[]> = {
  user_input: ["llm_analysis"],
  llm_analysis: ["propose_workflow"],
  propose_workflow: ["user_approve"],
  user_approve: ["request_templates"],
  request_templates: ["upload_templates"],
  upload_templates: ["validate_inject"],
  validate_inject: ["sandbox_execute"],
  sandbox_execute: ["doc_playwright"],
  doc_playwright: ["branch_leadtime"],
  branch_leadtime: ["generate_artifacts"],
  generate_artifacts: ["notify_audit"],
  notify_audit: ["workflow_complete"],
  workflow_complete: [],
};

export const AGENT_GRAPH_NODE_LABELS: Record<AgentGraphNodeId, string> = {
  user_input: "User Input (chat + documents)",
  llm_analysis: "LLM Analysis & Validation",
  propose_workflow: "Propose Automation Workflow",
  user_approve: "User Approval Gate",
  request_templates: "Request Company Templates",
  upload_templates: "User Upload Templates",
  validate_inject: "Validate & Inject Placeholders",
  sandbox_execute: "Execute in Isolated Sandbox (E2B)",
  doc_playwright: "Document Processing + Playwright",
  branch_leadtime: "Branched Execution + Lead Time",
  generate_artifacts: "Generate Documents & Reports",
  notify_audit: "Notify User + Audit Logs",
  workflow_complete: "Workflow Complete",
};

export function statusForNode(node: AgentGraphNodeId): AgentWorkflowStatus {
  switch (node) {
    case "user_input":
    case "llm_analysis":
      return "analyzing";
    case "propose_workflow":
      return "proposed";
    case "user_approve":
      return "awaiting_approval";
    case "request_templates":
    case "upload_templates":
      return "awaiting_templates";
    case "validate_inject":
      return "injecting_placeholders";
    case "sandbox_execute":
    case "doc_playwright":
    case "branch_leadtime":
    case "generate_artifacts":
      return "executing";
    case "notify_audit":
    case "workflow_complete":
      return "completed";
    default:
      return "draft";
  }
}

export function advanceGraphNode(
  current: AgentGraphNodeId,
): AgentGraphNodeId | null {
  return AGENT_GRAPH_EDGES[current]?.[0] ?? null;
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
  return run.status === "approved";
}

export function requiresApproval(run: AgentWorkflowRun): boolean {
  return (
    run.currentNode === "user_approve" ||
    run.status === "proposed" ||
    run.status === "awaiting_approval"
  );
}

export function requiresTemplates(run: AgentWorkflowRun): boolean {
  return (
    run.status === "awaiting_templates" ||
    run.currentNode === "request_templates" ||
    run.currentNode === "upload_templates"
  );
}

export function getGraphProgress(run: AgentWorkflowRun): Array<{
  node: AgentGraphNodeId;
  label: string;
  completed: boolean;
  current: boolean;
}> {
  const order = Object.keys(AGENT_GRAPH_NODE_LABELS) as AgentGraphNodeId[];
  const currentIndex = order.indexOf(run.currentNode);

  return order.map((node, index) => ({
    node,
    label: AGENT_GRAPH_NODE_LABELS[node],
    completed: index < currentIndex || run.status === "completed",
    current: node === run.currentNode,
  }));
}