import type { Edge, Node } from "reactflow";

import type { WorkflowExecutionCheckpoint } from "@/lib/workflow-execution-state";

/** Built-in node kinds for the chat workflow canvas (React Flow). */
export type WorkflowNodeKind =
  | "trigger"
  | "action"
  | "condition"
  | "output"
  | "approval";

/** Payload stored on each React Flow node (`node.data`). */
export interface WorkflowNodeData {
  label: string;
  kind: WorkflowNodeKind;
  description?: string;
  /** LLM instruction for action/output/condition nodes (also mirrored in config.prompt). */
  prompt?: string;
  config?: Record<string, unknown>;
}

export type WorkflowErrorCode =
  | "parse_failed"
  | "empty_workflow"
  | "execute_failed";

export type WorkflowExecutionLogStatus =
  | "skipped"
  | "running"
  | "completed"
  | "failed"
  | "paused"
  | "awaiting_approval";

export interface WorkflowExecutionLogEntry {
  nodeId: string;
  label: string;
  kind: WorkflowNodeKind;
  status: WorkflowExecutionLogStatus;
  /** Tool action invoked for this step (when not plain LLM). */
  actionId?: string;
  output?: string;
  message?: string;
  startedAt: number;
  completedAt?: number;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

/** A single automation workflow definition (nodes + edges). */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: number;
  updatedAt: number;
}

export type WorkflowExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "paused"
  | "awaiting_approval";

export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowExecutionStatus;
  startedAt: number;
  completedAt?: number;
  message?: string;
  logs?: WorkflowExecutionLogEntry[];
  output?: string;
  error?: WorkflowErrorCode | string;
}

/**
 * Workspace snapshot persisted on `ChatSession.workflow`.
 * Mirrors the worksheet multi-document pattern with a single active workflow.
 */
export interface WorkflowWorkspace {
  workflows: WorkflowDefinition[];
  activeWorkflowId: string | null;
  /** Runtime-only: workflow currently streaming execution (not persisted). */
  activeExecutionId?: string | null;
  updatedAt: number;
  lastExecution?: WorkflowExecutionResult | null;
  /** Persisted pause state for approval gates and error recovery. */
  executionCheckpoint?: WorkflowExecutionCheckpoint | null;
  /** True after discovery questions — next armed send should generate JSON. */
  chatDiscoveryPending?: boolean;
  error?: WorkflowErrorCode;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  /** When true (default), the new workflow becomes active. */
  activate?: boolean;
}

export type UpdateWorkflowPatch = Partial<
  Pick<WorkflowDefinition, "name" | "description" | "nodes" | "edges">
>;

export interface AddWorkflowNodeInput {
  label: string;
  kind?: WorkflowNodeKind;
  description?: string;
  position?: { x: number; y: number };
  config?: Record<string, unknown>;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Fresh workspace for a new chat session. */
export function createEmptyWorkflowWorkspace(): WorkflowWorkspace {
  const now = Date.now();
  return {
    workflows: [],
    activeWorkflowId: null,
    activeExecutionId: null,
    updatedAt: now,
    lastExecution: null,
  };
}

function cloneWorkflowDefinition(workflow: WorkflowDefinition): WorkflowDefinition {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position },
    })),
    edges: workflow.edges.map((edge) => ({ ...edge })),
  };
}

/** Deep-normalize an inbound workspace snapshot from ChatSession. */
export function normalizeWorkflowWorkspace(
  workspace: WorkflowWorkspace | null | undefined,
): WorkflowWorkspace {
  if (!workspace) return createEmptyWorkflowWorkspace();

  const workflows = (workspace.workflows ?? []).map(cloneWorkflowDefinition);
  const activeWorkflowId =
    workspace.activeWorkflowId &&
    workflows.some((wf) => wf.id === workspace.activeWorkflowId)
      ? workspace.activeWorkflowId
      : (workflows[0]?.id ?? null);

  return {
    workflows,
    activeWorkflowId,
    activeExecutionId: workspace.activeExecutionId ?? null,
    updatedAt: workspace.updatedAt ?? Date.now(),
    lastExecution: workspace.lastExecution ?? null,
    executionCheckpoint: workspace.executionCheckpoint ?? null,
    chatDiscoveryPending: workspace.chatDiscoveryPending ?? false,
    error: workspace.error,
  };
}

export function getWorkflowById(
  workspace: WorkflowWorkspace,
  workflowId: string,
): WorkflowDefinition | null {
  return workspace.workflows.find((wf) => wf.id === workflowId) ?? null;
}

export function getActiveWorkflow(
  workspace: WorkflowWorkspace,
): WorkflowDefinition | null {
  if (!workspace.activeWorkflowId) return null;
  return getWorkflowById(workspace, workspace.activeWorkflowId);
}

export function setActiveWorkflow(
  workspace: WorkflowWorkspace,
  workflowId: string | null,
): WorkflowWorkspace {
  if (
    workflowId !== null &&
    !workspace.workflows.some((wf) => wf.id === workflowId)
  ) {
    return workspace;
  }

  return {
    ...workspace,
    activeWorkflowId: workflowId,
    updatedAt: Date.now(),
  };
}

/** Append a new workflow definition to the workspace. */
export function createWorkflowDefinition(
  workspace: WorkflowWorkspace,
  input: CreateWorkflowInput,
): WorkflowWorkspace {
  const now = Date.now();
  const workflow: WorkflowDefinition = {
    id: createId("workflow"),
    name: input.name.trim() || "Untitled Workflow",
    description: input.description?.trim() || undefined,
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
  };

  const activate = input.activate !== false;

  return {
    ...workspace,
    workflows: [...workspace.workflows, workflow],
    activeWorkflowId: activate ? workflow.id : workspace.activeWorkflowId,
    updatedAt: now,
  };
}

/** Patch an existing workflow by id. */
export function updateWorkflowDefinition(
  workspace: WorkflowWorkspace,
  workflowId: string,
  patch: UpdateWorkflowPatch,
): WorkflowWorkspace {
  const index = workspace.workflows.findIndex((wf) => wf.id === workflowId);
  if (index < 0) return workspace;

  const now = Date.now();
  const current = workspace.workflows[index];
  const next: WorkflowDefinition = {
    ...current,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() || current.name : current.name,
    description:
      patch.description !== undefined
        ? patch.description.trim() || undefined
        : current.description,
    nodes: patch.nodes ?? current.nodes,
    edges: patch.edges ?? current.edges,
    updatedAt: now,
  };

  const workflows = [...workspace.workflows];
  workflows[index] = next;

  return {
    ...workspace,
    workflows,
    updatedAt: now,
  };
}

/** Add a canvas node to the target workflow (active workflow when id omitted). */
export function addWorkflowNode(
  workspace: WorkflowWorkspace,
  input: AddWorkflowNodeInput,
  workflowId?: string | null,
): WorkflowWorkspace {
  const targetId = workflowId ?? workspace.activeWorkflowId;
  if (!targetId) return workspace;

  const workflow = getWorkflowById(workspace, targetId);
  if (!workflow) return workspace;

  const nodeIndex = workflow.nodes.length;
  const node: WorkflowNode = {
    id: createId("wf-node"),
    type: "default",
    position: input.position ?? {
      x: 120 + nodeIndex * 48,
      y: 80 + nodeIndex * 72,
    },
    data: {
      label: input.label.trim() || `Step ${nodeIndex + 1}`,
      kind: input.kind ?? "action",
      description: input.description?.trim() || undefined,
      config: input.config,
    },
  };

  return updateWorkflowDefinition(workspace, targetId, {
    nodes: [...workflow.nodes, node],
  });
}

/** Stable fingerprint to skip redundant persist writes. */
export function buildWorkflowWorkspacePersistFingerprint(
  workspace: WorkflowWorkspace,
): string {
  return JSON.stringify({
    activeWorkflowId: workspace.activeWorkflowId,
    updatedAt: workspace.updatedAt,
    lastExecution: workspace.lastExecution,
    executionCheckpoint: workspace.executionCheckpoint ?? null,
    chatDiscoveryPending: workspace.chatDiscoveryPending ?? false,
    error: workspace.error,
    workflows: workspace.workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      updatedAt: wf.updatedAt,
      nodes: wf.nodes.map((node) => ({
        id: node.id,
        position: node.position,
        data: node.data,
      })),
      edges: wf.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    })),
  });
}

export function areWorkflowWorkspaceSnapshotsEqual(
  left: WorkflowWorkspace,
  right: WorkflowWorkspace,
): boolean {
  return (
    buildWorkflowWorkspacePersistFingerprint(left) ===
    buildWorkflowWorkspacePersistFingerprint(right)
  );
}

export function hasWorkflowWorkspaceContent(
  workspace: WorkflowWorkspace,
): boolean {
  return workspace.workflows.length > 0;
}

/** Remove a workflow definition and re-point the active workflow if needed. */
export function removeWorkflowDefinition(
  workspace: WorkflowWorkspace,
  workflowId: string,
): WorkflowWorkspace {
  const workflows = workspace.workflows.filter((wf) => wf.id !== workflowId);
  const activeWorkflowId =
    workspace.activeWorkflowId === workflowId
      ? (workflows[0]?.id ?? null)
      : workspace.activeWorkflowId;

  return {
    ...workspace,
    workflows,
    activeWorkflowId,
    updatedAt: Date.now(),
  };
}

/** Remove a node (and any connected edges) from a workflow. */
export interface ImportWorkflowFromStreamInput {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  /** When true (default), imported workflow becomes active. */
  activate?: boolean;
}

/** Update the active workflow graph from a chat edit payload (in-place). */
export function applyWorkflowChatEdit(
  workspace: WorkflowWorkspace,
  input: ImportWorkflowFromStreamInput,
): WorkflowWorkspace {
  const snapshot = normalizeWorkflowWorkspace(workspace);
  const activeId = snapshot.activeWorkflowId;
  const active = activeId ? getWorkflowById(snapshot, activeId) : null;

  if (!active) {
    return importWorkflowFromStream(snapshot, input);
  }

  return updateWorkflowDefinition(snapshot, active.id, {
    name: input.name.trim() || active.name,
    description: input.description?.trim() || active.description,
    nodes: input.nodes.map((node) => ({
      ...node,
      data: normalizeWorkflowNodeData(node.data),
      position: { ...node.position },
    })),
    edges: input.edges.map((edge) => ({ ...edge })),
  });
}

/** Replace or append a workflow from chat stream payload. */
export function importWorkflowFromStream(
  workspace: WorkflowWorkspace,
  input: ImportWorkflowFromStreamInput,
): WorkflowWorkspace {
  const now = Date.now();
  const workflow: WorkflowDefinition = {
    id: createId("workflow"),
    name: input.name.trim() || "Untitled Workflow",
    description: input.description?.trim() || undefined,
    nodes: input.nodes.map((node) => ({
      ...node,
      data: normalizeWorkflowNodeData(node.data),
      position: { ...node.position },
    })),
    edges: input.edges.map((edge) => ({ ...edge })),
    createdAt: now,
    updatedAt: now,
  };

  const activate = input.activate !== false;

  return {
    ...workspace,
    workflows: [...workspace.workflows, workflow],
    activeWorkflowId: activate ? workflow.id : workspace.activeWorkflowId,
    updatedAt: now,
    error: undefined,
  };
}

const WORKFLOW_NODE_KINDS = new Set<WorkflowNodeKind>([
  "trigger",
  "action",
  "condition",
  "output",
  "approval",
]);

function coerceWorkflowNodeKind(
  value: unknown,
  index: number,
  total: number,
): WorkflowNodeKind {
  if (
    typeof value === "string" &&
    WORKFLOW_NODE_KINDS.has(value as WorkflowNodeKind)
  ) {
    return value as WorkflowNodeKind;
  }

  if (index === 0) return "trigger";
  if (index === total - 1 && total > 1) return "output";
  return "action";
}

export function normalizeWorkflowNodeData(
  data: WorkflowNodeData | null | undefined,
): WorkflowNodeData {
  const safe = data ?? { label: "Step", kind: "action" as WorkflowNodeKind };
  const label =
    typeof safe.label === "string" ? safe.label.trim() || "Step" : "Step";
  const kind =
    typeof safe.kind === "string" &&
    WORKFLOW_NODE_KINDS.has(safe.kind as WorkflowNodeKind)
      ? safe.kind
      : "action";
  const prompt =
    (typeof safe.prompt === "string" ? safe.prompt.trim() : "") ||
    (typeof safe.config?.prompt === "string"
      ? safe.config.prompt.trim()
      : undefined);
  const description =
    typeof safe.description === "string"
      ? safe.description.trim() || undefined
      : undefined;

  return {
    ...safe,
    label,
    kind,
    description,
    prompt,
    config: prompt ? { ...safe.config, prompt } : safe.config,
  };
}

export interface NormalizeWorkflowTemplateGraphResult {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  fixes: string[];
}

/** Normalize template/import nodes & edges; auto-fix missing id, position, kind, and edges. */
export function normalizeWorkflowTemplateGraph(
  nodesInput: unknown,
  edgesInput?: unknown,
): NormalizeWorkflowTemplateGraphResult {
  const fixes: string[] = [];
  const rawNodes = Array.isArray(nodesInput) ? nodesInput : [];
  const nodeIdSet = new Set<string>();
  const nodes: WorkflowNode[] = [];

  rawNodes.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") {
      fixes.push(`node[${index}]: skipped invalid entry`);
      return;
    }

    const node = raw as Partial<WorkflowNode>;
    let id =
      typeof node.id === "string" && node.id.trim()
        ? node.id.trim()
        : createId("wf-node");
    if (!node.id) fixes.push(`node[${index}]: generated id`);

    while (nodeIdSet.has(id)) {
      id = createId("wf-node");
      fixes.push(`node[${index}]: deduplicated id`);
    }
    nodeIdSet.add(id);

    const rawPosition =
      node.position && typeof node.position === "object"
        ? (node.position as { x?: unknown; y?: unknown })
        : null;
    const position = {
      x:
        typeof rawPosition?.x === "number" && Number.isFinite(rawPosition.x)
          ? rawPosition.x
          : 80 + index * 200,
      y:
        typeof rawPosition?.y === "number" && Number.isFinite(rawPosition.y)
          ? rawPosition.y
          : 120,
    };
    if (!node.position) fixes.push(`node[${index}]: generated position`);

    const rawData =
      node.data && typeof node.data === "object"
        ? (node.data as Partial<WorkflowNodeData>)
        : {};
    const kind = coerceWorkflowNodeKind(rawData.kind, index, rawNodes.length);

    nodes.push({
      id,
      type: typeof node.type === "string" ? node.type : "workflow",
      position,
      data: normalizeWorkflowNodeData({
        ...rawData,
        kind,
        label:
          typeof rawData.label === "string"
            ? rawData.label
            : `Step ${index + 1}`,
      }),
    });
  });

  const edges: WorkflowEdge[] = [];
  const rawEdges = Array.isArray(edgesInput) ? edgesInput : [];

  if (rawEdges.length === 0 && nodes.length > 1) {
    for (let index = 0; index < nodes.length - 1; index += 1) {
      edges.push({
        id: createId("wf-edge"),
        source: nodes[index]!.id,
        target: nodes[index + 1]!.id,
      });
    }
    fixes.push("edges: auto-chained linear");
  } else {
    rawEdges.forEach((raw, index) => {
      if (!raw || typeof raw !== "object") {
        fixes.push(`edge[${index}]: skipped invalid entry`);
        return;
      }

      const edge = raw as Partial<WorkflowEdge>;
      const source =
        typeof edge.source === "string" ? edge.source.trim() : "";
      const target =
        typeof edge.target === "string" ? edge.target.trim() : "";

      if (!source || !target || !nodeIdSet.has(source) || !nodeIdSet.has(target)) {
        fixes.push(`edge[${index}]: skipped dangling edge`);
        return;
      }

      edges.push({
        id:
          typeof edge.id === "string" && edge.id.trim()
            ? edge.id.trim()
            : createId("wf-edge"),
        source,
        target,
      });
    });

    if (edges.length === 0 && nodes.length > 1) {
      for (let index = 0; index < nodes.length - 1; index += 1) {
        edges.push({
          id: createId("wf-edge"),
          source: nodes[index]!.id,
          target: nodes[index + 1]!.id,
        });
      }
      fixes.push("edges: rebuilt linear fallback");
    }
  }

  return { nodes, edges, fixes };
}

export function getWorkflowNodePrompt(node: WorkflowNode): string {
  const data = node.data;
  return (
    data.prompt?.trim() ||
    (typeof data.config?.prompt === "string" ? data.config.prompt.trim() : "") ||
    data.description?.trim() ||
    data.label
  );
}

export function setWorkflowWorkspaceError(
  workspace: WorkflowWorkspace,
  error: WorkflowErrorCode,
): WorkflowWorkspace {
  return {
    ...workspace,
    error,
    updatedAt: Date.now(),
  };
}

export function removeWorkflowNode(
  workspace: WorkflowWorkspace,
  workflowId: string,
  nodeId: string,
): WorkflowWorkspace {
  const workflow = getWorkflowById(workspace, workflowId);
  if (!workflow) return workspace;

  return updateWorkflowDefinition(workspace, workflowId, {
    nodes: workflow.nodes.filter((node) => node.id !== nodeId),
    edges: workflow.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    ),
  });
}

export type WorkflowTemplateApplyMode = "replace" | "append";

export interface WorkflowTemplateDefinitionInput {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

function cloneTemplateGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const normalized = normalizeWorkflowTemplateGraph(nodes, edges);
  const idMap = new Map<string, string>();

  const clonedNodes = normalized.nodes.map((node) => {
    const newId = createId("wf-node");
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      data: normalizeWorkflowNodeData(node.data),
      position: { ...node.position },
    };
  });

  const clonedEdges = normalized.edges.map((edge) => ({
    ...edge,
    id: createId("wf-edge"),
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }));

  return { nodes: clonedNodes, edges: clonedEdges };
}

function createWorkflowFromTemplateGraph(
  workspace: WorkflowWorkspace,
  input: WorkflowTemplateDefinitionInput,
  options?: { activate?: boolean },
): WorkflowWorkspace {
  const activate = options?.activate !== false;
  const { nodes, edges } = cloneTemplateGraph(input.nodes, input.edges);

  const created = createWorkflowDefinition(workspace, {
    name: input.name,
    description: input.description,
    activate,
  });
  const newActiveId = created.activeWorkflowId;
  if (!newActiveId) return created;

  return updateWorkflowDefinition(created, newActiveId, {
    nodes,
    edges,
  });
}

/** Apply a template graph to the workspace (replace active or append as new workflow). */
export function applyWorkflowTemplateToWorkspace(
  workspace: WorkflowWorkspace,
  input: WorkflowTemplateDefinitionInput,
  options?: { mode?: WorkflowTemplateApplyMode; activate?: boolean },
): WorkflowWorkspace {
  const mode = options?.mode ?? "replace";
  const activate = options?.activate !== false;
  const snapshot = normalizeWorkflowWorkspace(workspace);
  const { nodes, edges } = cloneTemplateGraph(input.nodes, input.edges);

  if (mode === "append") {
    return importWorkflowFromStream(snapshot, {
      name: input.name,
      description: input.description,
      nodes,
      edges,
      activate,
    });
  }

  const activeId = snapshot.activeWorkflowId;
  const activeWorkflow = activeId ? getWorkflowById(snapshot, activeId) : null;

  if (activeWorkflow) {
    return updateWorkflowDefinition(snapshot, activeWorkflow.id, {
      name: input.name,
      description: input.description,
      nodes,
      edges,
    });
  }

  return createWorkflowFromTemplateGraph(snapshot, input, { activate });
}

