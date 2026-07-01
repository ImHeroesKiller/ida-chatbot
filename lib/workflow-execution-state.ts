import type { Locale } from "@/lib/config";
import type {
  WorkflowDefinition,
  WorkflowExecutionLogEntry,
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/lib/workflow";

export type WorkflowExecutionPauseReason =
  | "approval"
  | "recovery"
  | "scheduled";

export type WorkflowResumeAction =
  | "approve"
  | "reject"
  | "retry"
  | "skip"
  | "continue";

export interface WorkflowExecutionCheckpoint {
  workflowId: string;
  locale: Locale;
  startedAt: number;
  context: string;
  logs: WorkflowExecutionLogEntry[];
  /** Index into ordered node list — next node to execute. */
  nextNodeIndex: number;
  orderedNodeIds: string[];
  pauseReason: WorkflowExecutionPauseReason;
  pendingNodeId: string;
  pendingNodeLabel: string;
  pendingNodeKind: WorkflowNodeKind;
  /** Retry attempts already consumed for the pending node. */
  retryCount?: number;
  maxRetries?: number;
  errorMessage?: string;
  errorSuggestion?: string;
  approvalPrompt?: string;
  scheduledRunAt?: number;
}

export function buildOrderedNodeIds(workflow: WorkflowDefinition): string[] {
  const nodes = [...workflow.nodes];
  if (nodes.length === 0) return [];

  const incoming = new Map<string, number>();
  for (const node of nodes) incoming.set(node.id, 0);
  for (const edge of workflow.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  }

  const triggers = nodes.filter((node) => node.data.kind === "trigger");
  const queue = [
    ...(triggers.length > 0
      ? triggers
      : nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0)),
  ];

  const visited = new Set<string>();
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    ordered.push(current.id);

    for (const edge of workflow.edges) {
      if (edge.source !== current.id) continue;
      const target = nodes.find((node) => node.id === edge.target);
      if (target && !visited.has(target.id)) queue.push(target);
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) ordered.push(node.id);
  }

  return ordered;
}

export function getNodeMaxRetries(node: WorkflowNode): number {
  const raw = node.data.config?.maxRetries;
  if (typeof raw === "number" && raw >= 0) return Math.min(raw, 5);
  return 2;
}

export function suggestWorkflowErrorRecovery(options: {
  node: WorkflowNode;
  errorMessage: string;
  locale: Locale;
}): string {
  const { node, errorMessage, locale } = options;
  const label = node.data.label;

  if (/model is not configured|api key/i.test(errorMessage)) {
    return locale === "id"
      ? "Periksa konfigurasi model workflow di Admin → Models, lalu klik Retry."
      : locale === "zh"
        ? "请在管理后台检查工作流模型配置，然后重试。"
        : "Check workflow model configuration in Admin → Models, then Retry.";
  }

  if (/rate limit/i.test(errorMessage)) {
    return locale === "id"
      ? "Tunggu beberapa menit atau kurangi frekuensi eksekusi, lalu Retry."
      : locale === "zh"
        ? "请稍等几分钟后重试，或降低执行频率。"
        : "Wait a few minutes or reduce execution frequency, then Retry.";
  }

  if (node.data.kind === "condition") {
    return locale === "id"
      ? `Perjelas prompt kondisi pada "${label}" agar menghasilkan YES/NO yang jelas, lalu Retry.`
      : locale === "zh"
        ? `请明确节点「${label}」的条件提示，使其返回清晰的 YES/NO，然后重试。`
        : `Clarify the condition prompt on "${label}" to return a clear YES/NO, then Retry.`;
  }

  return locale === "id"
    ? `Periksa prompt/instruksi node "${label}". Anda bisa Retry, Skip node ini, atau Continue manual.`
    : locale === "zh"
      ? `请检查节点「${label}」的提示词。您可以重试、跳过此节点或手动继续。`
      : `Review the prompt on "${label}". You can Retry, Skip this node, or Continue manually.`;
}

export function checkpointToExecutionResult(
  checkpoint: WorkflowExecutionCheckpoint,
  status: WorkflowExecutionResult["status"],
  message: string,
): WorkflowExecutionResult {
  return {
    workflowId: checkpoint.workflowId,
    status,
    startedAt: checkpoint.startedAt,
    completedAt: Date.now(),
    message,
    logs: [...checkpoint.logs],
    output: checkpoint.context,
  };
}

export function applyResumeActionToCheckpoint(
  checkpoint: WorkflowExecutionCheckpoint,
  action: WorkflowResumeAction,
  note?: string,
): WorkflowExecutionCheckpoint {
  const next = { ...checkpoint, logs: [...checkpoint.logs] };

  if (action === "approve") {
    const log: WorkflowExecutionLogEntry = {
      nodeId: checkpoint.pendingNodeId,
      label: checkpoint.pendingNodeLabel,
      kind: checkpoint.pendingNodeKind,
      status: "completed",
      output: note?.trim() || "Approved",
      message: "Approved by user",
      startedAt: Date.now(),
      completedAt: Date.now(),
    };
    next.logs.push(log);
    next.context += `\n\n[approval] ${checkpoint.pendingNodeLabel}: Approved${note ? ` — ${note}` : ""}`;
    next.nextNodeIndex += 1;
    return next;
  }

  if (action === "reject") {
    const log: WorkflowExecutionLogEntry = {
      nodeId: checkpoint.pendingNodeId,
      label: checkpoint.pendingNodeLabel,
      kind: checkpoint.pendingNodeKind,
      status: "failed",
      message: note?.trim() || "Rejected by user",
      startedAt: Date.now(),
      completedAt: Date.now(),
    };
    next.logs.push(log);
    next.context += `\n\n[approval] ${checkpoint.pendingNodeLabel}: Rejected`;
    return next;
  }

  if (action === "skip") {
    const log: WorkflowExecutionLogEntry = {
      nodeId: checkpoint.pendingNodeId,
      label: checkpoint.pendingNodeLabel,
      kind: checkpoint.pendingNodeKind,
      status: "skipped",
      message: note?.trim() || "Skipped by user",
      startedAt: Date.now(),
      completedAt: Date.now(),
    };
    next.logs.push(log);
    next.context += `\n\n[${checkpoint.pendingNodeKind}] ${checkpoint.pendingNodeLabel}: (skipped)`;
    next.nextNodeIndex += 1;
    return next;
  }

  if (action === "continue") {
    const log: WorkflowExecutionLogEntry = {
      nodeId: checkpoint.pendingNodeId,
      label: checkpoint.pendingNodeLabel,
      kind: checkpoint.pendingNodeKind,
      status: "skipped",
      message: note?.trim() || "Continued manually by user",
      startedAt: Date.now(),
      completedAt: Date.now(),
    };
    next.logs.push(log);
    next.nextNodeIndex += 1;
    return next;
  }

  return next;
}