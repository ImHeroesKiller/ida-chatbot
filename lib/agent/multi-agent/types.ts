import type { Locale } from "@/lib/config";
import type { ResolvedWorkflowNodeAction } from "@/lib/workflow-actions";
import type { WorkflowNode, WorkflowNodeKind } from "@/lib/workflow";

/** Specialized agents coordinated by the supervisor. */
export type MultiAgentId =
  | "supervisor"
  | "researcher"
  | "analyst"
  | "executor"
  | "approver"
  | "documenter";

export type MultiAgentActivityStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface MultiAgentActivity {
  id: string;
  agentId: MultiAgentId;
  nodeId: string;
  nodeLabel: string;
  status: MultiAgentActivityStatus;
  message: string;
  output?: string;
  startedAt: number;
  completedAt?: number;
}

export interface MultiAgentStepInput {
  locale: Locale;
  node: WorkflowNode;
  action: ResolvedWorkflowNodeAction;
  workflowContext: string;
  prompt: string;
}

export interface MultiAgentStepResult {
  success: boolean;
  output: string;
  message: string;
  dispatch?: Record<string, string>;
  activities: MultiAgentActivity[];
  assignedAgent: MultiAgentId;
  awaitingApproval?: boolean;
}

export const MULTI_AGENT_IDS: MultiAgentId[] = [
  "supervisor",
  "researcher",
  "analyst",
  "executor",
  "approver",
  "documenter",
];

export const MULTI_AGENT_LABELS: Record<
  Locale,
  Record<MultiAgentId, string>
> = {
  id: {
    supervisor: "Supervisor",
    researcher: "Peneliti",
    analyst: "Analis",
    executor: "Eksekutor",
    approver: "Persetujuan",
    documenter: "Dokumenter",
  },
  en: {
    supervisor: "Supervisor",
    researcher: "Researcher",
    analyst: "Analyst",
    executor: "Executor",
    approver: "Approver",
    documenter: "Documenter",
  },
  zh: {
    supervisor: "监督者",
    researcher: "研究员",
    analyst: "分析师",
    executor: "执行者",
    approver: "审批者",
    documenter: "文档员",
  },
};

export function getMultiAgentLabel(
  agentId: MultiAgentId,
  locale: Locale,
): string {
  return MULTI_AGENT_LABELS[locale][agentId] ?? agentId;
}

/** Map a workflow canvas node to the specialist agent the supervisor should dispatch. */
export function resolveAgentForWorkflowNode(
  node: WorkflowNode,
  action: ResolvedWorkflowNodeAction,
): Exclude<MultiAgentId, "supervisor"> {
  if (node.data.kind === "approval") return "approver";
  if (node.data.kind === "output") return "documenter";
  if (action.id === "web_search" || action.id === "research") {
    return "researcher";
  }
  if (action.id === "worksheet_update" || action.id === "map_pin") {
    return "executor";
  }
  if (node.data.kind === "condition") return "analyst";
  return "analyst";
}

export function kindUsesMultiAgent(kind: WorkflowNodeKind): boolean {
  return kind !== "trigger";
}