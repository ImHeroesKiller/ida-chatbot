import type { AgentGraphNodeId, AgentWorkflowRun, AgentWorkflowStatus } from "./types";

/** UI phases aligned with AgentFlow Technical Specification v1.0 §5 */
export type AgentUiPhase =
  | "input"
  | "proposal"
  | "approve"
  | "templates"
  | "inject"
  | "execute"
  | "complete"
  | "cancelled";

export const AGENT_UI_PHASE_ORDER: AgentUiPhase[] = [
  "input",
  "proposal",
  "approve",
  "templates",
  "inject",
  "execute",
  "complete",
];

export const AGENT_UI_PHASE_LABELS: Record<
  AgentUiPhase,
  { id: string; en: string; zh: string }
> = {
  input: {
    id: "1. Instruksi & Dokumen",
    en: "1. Instruction & Documents",
    zh: "1. 指令与文档",
  },
  proposal: {
    id: "2. Review Proposal",
    en: "2. Review Proposal",
    zh: "2. 审查提案",
  },
  approve: {
    id: "3. Approve Workflow",
    en: "3. Approve Workflow",
    zh: "3. 批准工作流",
  },
  templates: {
    id: "4. Upload Template",
    en: "4. Upload Template",
    zh: "4. 上传模板",
  },
  inject: {
    id: "5. Inject Placeholders",
    en: "5. Inject Placeholders",
    zh: "5. 注入占位符",
  },
  execute: {
    id: "6. Approve & Execute",
    en: "6. Approve & Execute",
    zh: "6. 批准并执行",
  },
  complete: {
    id: "7. Results",
    en: "7. Results",
    zh: "7. 结果",
  },
  cancelled: {
    id: "Dibatalkan",
    en: "Cancelled",
    zh: "已取消",
  },
};

const STATUS_TO_PHASE: Record<AgentWorkflowStatus, AgentUiPhase> = {
  draft: "input",
  analyzing: "input",
  proposed: "proposal",
  awaiting_approval: "approve",
  awaiting_templates: "templates",
  injecting_placeholders: "inject",
  approved: "execute",
  executing: "execute",
  completed: "complete",
  cancelled: "cancelled",
  failed: "cancelled",
};

const NODE_TO_PHASE: Partial<Record<AgentGraphNodeId, AgentUiPhase>> = {
  user_input: "input",
  llm_analysis: "input",
  propose_workflow: "proposal",
  user_approve: "approve",
  request_templates: "templates",
  upload_templates: "templates",
  validate_inject: "inject",
  execution_approve: "execute",
  sandbox_execute: "execute",
  doc_playwright: "execute",
  branch_leadtime: "execute",
  generate_artifacts: "execute",
  notify_audit: "complete",
  workflow_complete: "complete",
};

export function getUiPhase(run: AgentWorkflowRun | null): AgentUiPhase {
  if (!run) return "input";
  if (run.status === "cancelled" || run.status === "failed") return "cancelled";
  return NODE_TO_PHASE[run.currentNode] ?? STATUS_TO_PHASE[run.status] ?? "input";
}

export function getPhaseIndex(phase: AgentUiPhase): number {
  if (phase === "cancelled") return -1;
  return AGENT_UI_PHASE_ORDER.indexOf(phase);
}

export function isPhaseComplete(
  current: AgentUiPhase,
  target: AgentUiPhase,
): boolean {
  if (current === "cancelled") return false;
  return getPhaseIndex(current) > getPhaseIndex(target);
}

export function isPhaseActive(
  current: AgentUiPhase,
  target: AgentUiPhase,
): boolean {
  return current === target;
}