import type { WorkflowEdge, WorkflowNode, WorkflowNodeData } from "@/lib/workflow";
import { normalizeWorkflowNodeData } from "@/lib/workflow";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDefaultGeneratedPosition(
  position: { x: number; y: number },
  index: number,
): boolean {
  return (
    position.x === 120 + index * 48 && position.y === 80 + index * 72
  );
}

function mergeConfig(
  existing: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const base = { ...(existing ?? {}) };
  const next = { ...(incoming ?? {}) };

  const existingParams = isPlainObject(base.actionParams)
    ? base.actionParams
    : {};
  const incomingParams = isPlainObject(next.actionParams)
    ? next.actionParams
    : {};

  const merged: Record<string, unknown> = {
    ...base,
    ...next,
    actionParams: {
      ...existingParams,
      ...incomingParams,
    },
  };

  const prompt =
    (typeof next.prompt === "string" && next.prompt.trim()) ||
    (typeof base.prompt === "string" && base.prompt.trim()) ||
    undefined;
  if (prompt) merged.prompt = prompt;

  if (typeof next.action === "string" && next.action.trim()) {
    merged.action = next.action.trim();
  } else if (typeof base.action === "string" && base.action.trim()) {
    merged.action = base.action.trim();
  }

  if (typeof next.schedule === "object" && next.schedule) {
    merged.schedule = next.schedule;
  }

  if (typeof next.maxRetries === "number") {
    merged.maxRetries = next.maxRetries;
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

/** Merge an incoming chat-edit node onto an existing canvas node. */
export function mergeWorkflowChatEditNode(
  existing: WorkflowNode,
  incoming: WorkflowNode,
  incomingIndex: number,
): WorkflowNode {
  const existingData = normalizeWorkflowNodeData(existing.data);
  const incomingData = normalizeWorkflowNodeData(incoming.data);

  const mergedData: WorkflowNodeData = {
    ...existingData,
    label: incomingData.label.trim() || existingData.label,
    kind: incomingData.kind || existingData.kind,
    description: incomingData.description ?? existingData.description,
    prompt: incomingData.prompt ?? existingData.prompt,
    config: mergeConfig(existingData.config, incomingData.config),
  };

  const keepPosition =
    isDefaultGeneratedPosition(incoming.position, incomingIndex) &&
    !isDefaultGeneratedPosition(existing.position, incomingIndex);

  return {
    ...existing,
    id: existing.id,
    type: incoming.type ?? existing.type ?? "workflow",
    position: keepPosition ? existing.position : incoming.position,
    data: mergedData,
  };
}

function indexNodesByLabel(nodes: WorkflowNode[]): Map<string, WorkflowNode> {
  const map = new Map<string, WorkflowNode>();
  for (const node of nodes) {
    const key = node.data.label.trim().toLowerCase();
    if (key) map.set(key, node);
  }
  return map;
}

/**
 * Apply chat-edit nodes onto the active workflow, matching by id then label
 * so tool/action/prompt changes sync without losing stable node ids.
 */
export function mergeWorkflowChatEditGraph(options: {
  existingNodes: WorkflowNode[];
  incomingNodes: WorkflowNode[];
  incomingEdges: WorkflowEdge[];
}): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const { existingNodes, incomingNodes, incomingEdges } = options;
  const existingById = new Map(existingNodes.map((node) => [node.id, node]));
  const existingByLabel = indexNodesByLabel(existingNodes);

  const mergedNodes = incomingNodes.map((incoming, index) => {
    const normalizedIncoming: WorkflowNode = {
      ...incoming,
      data: normalizeWorkflowNodeData(incoming.data),
      position: { ...incoming.position },
    };

    const prior =
      existingById.get(normalizedIncoming.id) ??
      existingByLabel.get(normalizedIncoming.data.label.trim().toLowerCase());

    if (!prior) {
      return normalizedIncoming;
    }

    return mergeWorkflowChatEditNode(prior, normalizedIncoming, index);
  });

  const nodeIds = new Set(mergedNodes.map((node) => node.id));
  const edges = incomingEdges
    .map((edge) => ({ ...edge }))
    .filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );

  return { nodes: mergedNodes, edges };
}