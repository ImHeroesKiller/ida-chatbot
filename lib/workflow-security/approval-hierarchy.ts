import type { WorkflowNode } from "@/lib/workflow";

import type {
  WorkflowApprovalLevel,
  WorkflowApprovalState,
  WorkflowSecuritySettings,
} from "./types";

export function readNodeApprovalLevels(
  node: WorkflowNode,
  security: WorkflowSecuritySettings,
): WorkflowApprovalLevel[] {
  const rawLevels = node.data.config?.approvalLevels;
  if (Array.isArray(rawLevels) && rawLevels.length > 0) {
    return rawLevels
      .map((entry, index): WorkflowApprovalLevel | null => {
        if (!entry || typeof entry !== "object") return null;
        const data = entry as Record<string, unknown>;
        const level =
          typeof data.level === "number" ? data.level : index + 1;
        const label =
          typeof data.label === "string" && data.label.trim()
            ? data.label.trim()
            : `Level ${level}`;
        const parsed: WorkflowApprovalLevel = { level, label };
        if (typeof data.requiredRole === "string") {
          parsed.requiredRole =
            data.requiredRole as WorkflowApprovalLevel["requiredRole"];
        }
        return parsed;
      })
      .filter((entry): entry is WorkflowApprovalLevel => entry !== null);
  }

  const countRaw = node.data.config?.approvalLevelCount;
  const count =
    typeof countRaw === "number" && countRaw > 0
      ? Math.min(Math.floor(countRaw), 5)
      : (security.approvalHierarchy?.length ?? 1);

  const hierarchy = security.approvalHierarchy ?? [];
  if (hierarchy.length >= count) {
    return hierarchy.slice(0, count);
  }

  return Array.from({ length: count }, (_, index) => {
    const level = index + 1;
    return (
      hierarchy[index] ?? {
        level,
        label: level === 1 ? "Primary Approval" : `Approval Level ${level}`,
      }
    );
  });
}

export function createApprovalState(
  nodeId: string,
  levels: WorkflowApprovalLevel[],
): WorkflowApprovalState {
  return {
    nodeId,
    totalLevels: Math.max(levels.length, 1),
    currentLevel: 1,
    completedLevels: [],
    history: [],
  };
}

export function getCurrentApprovalLevelLabel(
  state: WorkflowApprovalState,
  levels: WorkflowApprovalLevel[],
): string {
  const config = levels.find((entry) => entry.level === state.currentLevel);
  return config?.label ?? `Level ${state.currentLevel}`;
}

export function applyApprovalDecision(options: {
  state: WorkflowApprovalState;
  action: "approve" | "reject";
  actorId?: string;
  note?: string;
}): WorkflowApprovalState {
  const now = Date.now();
  const record = {
    level: options.state.currentLevel,
    action: options.action,
    actorId: options.actorId,
    note: options.note,
    at: now,
  };

  if (options.action === "reject") {
    return {
      ...options.state,
      history: [...options.state.history, record],
    };
  }

  const completedLevels = [
    ...options.state.completedLevels,
    options.state.currentLevel,
  ];
  const nextLevel = options.state.currentLevel + 1;
  const allComplete = nextLevel > options.state.totalLevels;

  return {
    ...options.state,
    completedLevels,
    currentLevel: allComplete ? options.state.currentLevel : nextLevel,
    history: [...options.state.history, record],
  };
}

export function isApprovalChainComplete(state: WorkflowApprovalState): boolean {
  return state.completedLevels.length >= state.totalLevels;
}