"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { ToolQuotaState } from "@/components/chat/tools/types";
import type { MultiAgentActivity } from "@/lib/agent/multi-agent";
import { consumeWorkflowExecuteStream } from "@/lib/client/parse-workflow-sse";
import type {
  WorkflowExecutionCheckpoint,
  WorkflowResumeAction,
} from "@/lib/workflow-execution-state";
import {
  parseWorkflowFromResponse,
  workflowPayloadToDefinition,
  type WorkflowStreamPayload,
} from "@/lib/workflow-chat";
import type { Locale } from "@/lib/config";
import { resolveWorkflowErrorMessage } from "@/lib/workflow-feedback";
import {
  applyWorkflowChatEdit,
  applyWorkflowTemplateToWorkspace,
  addWorkflowNode,
  areWorkflowWorkspaceSnapshotsEqual,
  buildWorkflowWorkspacePersistFingerprint,
  createEmptyWorkflowWorkspace,
  createWorkflowDefinition,
  getActiveWorkflow,
  getWorkflowById,
  importWorkflowFromStream,
  normalizeWorkflowWorkspace,
  removeWorkflowDefinition,
  removeWorkflowNode,
  setActiveWorkflow,
  setWorkflowWorkspaceError,
  updateWorkflowDefinition,
  type AddWorkflowNodeInput,
  type CreateWorkflowInput,
  type UpdateWorkflowPatch,
  type WorkflowDefinition,
  type WorkflowErrorCode,
  type WorkflowExecutionLogEntry,
  type WorkflowExecutionResult,
  type WorkflowTemplateApplyMode,
  type WorkflowWorkspace,
} from "@/lib/workflow";
import {
  buildWorkflowChatContext,
  type WorkflowChatContext,
} from "@/lib/workflow-chat";
import {
  parseWorkflowImportJson,
  resolveWorkflowTemplate,
  serializeWorkflowForExport,
  type WorkflowTemplate,
  type WorkflowTemplateApplyResult,
} from "@/lib/workflow-templates";

import {
  executeClientWorkflowAction,
  type WorkflowToolCoordinatorBridge,
} from "@/components/chat/tools/workflow-node-actions-client";

import { createWorkflowQuotaState } from "./workflow-quota";

const PANEL_ID = TOOL_PANEL_IDS.workflow;

/** Re-export core workflow types used across the tool and panel. */
export type {
  AddWorkflowNodeInput,
  CreateWorkflowInput,
  UpdateWorkflowPatch,
  WorkflowDefinition,
  WorkflowErrorCode,
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowNodeKind,
  WorkflowEdge,
  WorkflowWorkspace,
} from "@/lib/workflow";

export type { WorkflowStreamPayload } from "@/lib/workflow-chat";

/** Workspace snapshot persisted on `ChatSession.workflow`. */
export type WorkflowWorkspaceState = WorkflowWorkspace;

type PersistLayerSync = (workspace: WorkflowWorkspaceState) => void;

function buildWorkflowGraphFingerprint(
  workflow: WorkflowDefinition,
): string {
  return JSON.stringify({
    nodes: workflow.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      data: node.data,
    })),
    edges: workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  });
}

function isSameWorkflowGraph(
  left: WorkflowDefinition,
  right: WorkflowDefinition,
): boolean {
  return buildWorkflowGraphFingerprint(left) === buildWorkflowGraphFingerprint(right);
}

export interface WorkflowHydrationInput extends ToolHydrationInput {
  workspace?: WorkflowWorkspace | null;
  isExecuting?: boolean;
}

export type WorkflowTool = BaseToolState &
  BaseToolLifecycle<WorkflowHydrationInput> & {
    quota: ToolQuotaState;
    workspace: WorkflowWorkspaceState;
    workflows: WorkflowDefinition[];
    activeWorkflowId: string | null;
    activeExecutionId: string | null;
    activeWorkflow: WorkflowDefinition | null;
    isExecuting: boolean;
    executionNodeStatus: Record<string, WorkflowExecutionLogEntry["status"]>;
    multiAgentActivities: MultiAgentActivity[];
    lastExecution: WorkflowExecutionResult | null;
    errorDetail: string | null;
    setErrorDetail: (message: string | null) => void;
    clearErrorDetail: () => void;
    getWorkspace: () => WorkflowWorkspaceState;
    setWorkspace: (workspace: WorkflowWorkspaceState) => void;
    updateWorkspace: (patch: Partial<WorkflowWorkspaceState>) => void;
    /** Hydrate runtime workspace from an external snapshot (persist layer / chat). */
    hydrateFromExternal: (
      workspace: WorkflowWorkspaceState,
    ) => WorkflowWorkspaceState;
    /** Mirror the current (or provided) workspace snapshot into the persist layer. */
    syncToPersistLayer: (
      workspace?: WorkflowWorkspaceState,
      options?: { force?: boolean },
    ) => WorkflowWorkspaceState;
    registerSyncToPersistLayer: (sync: PersistLayerSync | null) => void;
    /** Chat-room bridge for worksheet/map/research tool dispatch during execution. */
    registerToolCoordinatorBridge: (
      bridge: WorkflowToolCoordinatorBridge | null,
    ) => void;
    setActiveWorkflowId: (workflowId: string | null) => WorkflowWorkspaceState;
    selectWorkflow: (workflowId: string) => void;
    createWorkflow: (input: CreateWorkflowInput) => WorkflowDefinition | null;
    updateWorkflow: (
      workflowId: string,
      patch: UpdateWorkflowPatch,
    ) => WorkflowWorkspaceState;
    addNode: (
      input: AddWorkflowNodeInput,
      workflowId?: string | null,
    ) => WorkflowWorkspaceState;
    beginRegenerate: () => void;
    importWorkflowFromStream: (
      payload: WorkflowStreamPayload,
    ) => WorkflowDefinition | null;
    /** Raw assistant text from the latest workflow-armed chat stream. */
    lastGeneratedWorkflowSource: string | null;
    setLastGeneratedWorkflowSource: (source: string | null) => void;
    hasImportableGeneratedWorkflow: boolean;
    importLatestGeneratedWorkflow: (
      locale: Locale,
    ) => WorkflowDefinition | null;
    applyStreamError: (
      errorCode: WorkflowErrorCode,
      message?: string | null,
    ) => WorkflowWorkspaceState;
    executeWorkflow: (
      workflowId?: string | null,
      options?: { locale?: Locale; sessionId?: string },
    ) => Promise<WorkflowExecutionResult | null>;
    resumeWorkflow: (
      action: WorkflowResumeAction,
      note?: string,
      options?: { locale?: Locale; sessionId?: string },
    ) => Promise<WorkflowExecutionResult | null>;
    executionCheckpoint: WorkflowExecutionCheckpoint | null;
    clearExecutionCheckpoint: () => WorkflowWorkspaceState;
    buildWorkflowChatContext: (
      messages?: import("@/lib/types").IdaMessage[],
    ) => WorkflowChatContext;
    setChatDiscoveryPending: (pending: boolean) => WorkflowWorkspaceState;
    deleteWorkflow: (workflowId?: string | null) => WorkflowWorkspaceState;
    deleteNode: (
      nodeId: string,
      workflowId?: string | null,
    ) => WorkflowWorkspaceState;
    applyTemplate: (
      template: WorkflowTemplate,
      options?: {
        locale?: Locale;
        mode?: WorkflowTemplateApplyMode;
        activate?: boolean;
      },
    ) => WorkflowTemplateApplyResult;
    exportActiveWorkflowJson: () => string | null;
    importWorkflowJson: (
      raw: string,
      options?: { mode?: WorkflowTemplateApplyMode },
    ) => WorkflowTemplateApplyResult;
    resetWorkspace: () => void;
  };

function applyWorkspacePatch(
  prev: WorkflowWorkspaceState,
  patch: Partial<WorkflowWorkspaceState>,
): WorkflowWorkspaceState {
  return normalizeWorkflowWorkspace({
    ...prev,
    ...patch,
  });
}

/**
 * useWorkflow — Single Source of Truth (SSOT) for workflow canvas runtime state.
 *
 * Semua mutasi panel harus melalui hook ini, lalu:
 *   mutasi → syncToPersistLayer() → persist layer → ChatSession.workflow
 *
 * `hydrateFromExternal` hanya untuk inbound navigasi (load chat), bukan echo persist.
 */
export function useWorkflow(): WorkflowTool {
  const [quota, setQuota] = useState<ToolQuotaState>(createWorkflowQuotaState);
  const [workspace, setWorkspaceInternal] = useState<WorkflowWorkspaceState>(
    createEmptyWorkflowWorkspace,
  );
  const workspaceRef = useRef(workspace);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionNodeStatus, setExecutionNodeStatus] = useState<
    Record<string, WorkflowExecutionLogEntry["status"]>
  >({});
  const [multiAgentActivities, setMultiAgentActivities] = useState<
    MultiAgentActivity[]
  >([]);
  const isExecutingRef = useRef(false);
  const executionTokenRef = useRef(0);
  const executionAbortRef = useRef<AbortController | null>(null);
  const [errorDetail, setErrorDetailState] = useState<string | null>(null);
  const errorDetailRef = useRef<string | null>(null);
  const persistSyncRef = useRef<PersistLayerSync | null>(null);
  const toolCoordinatorBridgeRef = useRef<WorkflowToolCoordinatorBridge | null>(
    null,
  );
  const lastPersistedFingerprintRef = useRef<string | null>(null);
  const lastGeneratedWorkflowSourceRef = useRef<string | null>(null);
  const [lastGeneratedWorkflowSource, setLastGeneratedWorkflowSourceState] =
    useState<string | null>(null);
  const resetPersistFingerprint = useCallback(() => {
    lastPersistedFingerprintRef.current = null;
  }, []);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  const setWorkspace = useCallback((next: WorkflowWorkspaceState) => {
    const normalized = normalizeWorkflowWorkspace(next);
    workspaceRef.current = normalized;
    setWorkspaceInternal(normalized);
  }, []);

  const getWorkspace = useCallback(() => workspaceRef.current, []);

  const updateWorkspace = useCallback(
    (patch: Partial<WorkflowWorkspaceState>) => {
      setWorkspaceInternal((prev) => {
        const synced = applyWorkspacePatch(prev, patch);
        workspaceRef.current = synced;
        return synced;
      });
    },
    [],
  );

  const hydrateFromExternal = useCallback(
    (external: WorkflowWorkspaceState): WorkflowWorkspaceState => {
      const normalized = normalizeWorkflowWorkspace(external);

      if (areWorkflowWorkspaceSnapshotsEqual(workspaceRef.current, normalized)) {
        return workspaceRef.current;
      }

      setWorkspace(normalized);
      lastPersistedFingerprintRef.current =
        buildWorkflowWorkspacePersistFingerprint(normalized);
      return normalized;
    },
    [setWorkspace],
  );

  const registerSyncToPersistLayer = useCallback(
    (sync: PersistLayerSync | null) => {
      persistSyncRef.current = sync;
    },
    [],
  );

  const registerToolCoordinatorBridge = useCallback(
    (bridge: WorkflowToolCoordinatorBridge | null) => {
      toolCoordinatorBridgeRef.current = bridge;
    },
    [],
  );

  const syncToPersistLayer = useCallback(
    (
      nextWorkspace?: WorkflowWorkspaceState,
      options?: { force?: boolean },
    ): WorkflowWorkspaceState => {
      const current = nextWorkspace ?? getWorkspace();
      const snapshot = normalizeWorkflowWorkspace(current);
      const fingerprint = buildWorkflowWorkspacePersistFingerprint(snapshot);

      if (
        !options?.force &&
        fingerprint === lastPersistedFingerprintRef.current
      ) {
        return workspaceRef.current;
      }

      if (
        !options?.force &&
        areWorkflowWorkspaceSnapshotsEqual(workspaceRef.current, snapshot)
      ) {
        return workspaceRef.current;
      }

      const persisted = normalizeWorkflowWorkspace({
        ...snapshot,
        activeExecutionId: null,
        updatedAt: Date.now(),
      });
      const persistedFingerprint =
        buildWorkflowWorkspacePersistFingerprint(persisted);
      const shouldUpdateReact =
        options?.force === true ||
        !areWorkflowWorkspaceSnapshotsEqual(workspaceRef.current, persisted);

      lastPersistedFingerprintRef.current = persistedFingerprint;
      persistSyncRef.current?.(persisted);
      workspaceRef.current = persisted;

      if (shouldUpdateReact) {
        setWorkspaceInternal(persisted);
      }

      return persisted;
    },
    [getWorkspace],
  );

  const resetQuota = useCallback(() => {
    setQuota(createWorkflowQuotaState());
  }, []);

  const setErrorDetail = useCallback((message: string | null) => {
    errorDetailRef.current = message;
    setErrorDetailState(message);
  }, []);

  const clearErrorDetail = useCallback(() => {
    errorDetailRef.current = null;
    setErrorDetailState(null);
  }, []);

  const setLastGeneratedWorkflowSource = useCallback((source: string | null) => {
    const normalized = source?.trim() ? source : null;
    lastGeneratedWorkflowSourceRef.current = normalized;
    setLastGeneratedWorkflowSourceState(normalized);
  }, []);

  const resetWorkspace = useCallback(() => {
    const empty = createEmptyWorkflowWorkspace();
    workspaceRef.current = empty;
    setWorkspaceInternal(empty);
    setIsExecuting(false);
    clearErrorDetail();
    resetPersistFingerprint();
    setLastGeneratedWorkflowSource(null);
  }, [clearErrorDetail, resetPersistFingerprint, setLastGeneratedWorkflowSource]);

  const hydrateWorkspaceState = useCallback((state: WorkflowHydrationInput) => {
    if (state.workspace !== undefined) {
      const normalized = normalizeWorkflowWorkspace(state.workspace);
      workspaceRef.current = normalized;
      setWorkspaceInternal(normalized);
      lastPersistedFingerprintRef.current =
        buildWorkflowWorkspacePersistFingerprint(normalized);
    }

    if (state.isExecuting !== undefined) {
      setIsExecuting(state.isExecuting);
    } else if (state.workspace !== undefined) {
      setIsExecuting(false);
    }
  }, []);

  const {
    panelId,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  } = useBaseToolState<WorkflowHydrationInput>(PANEL_ID, {
    onReset: () => {
      resetQuota();
      resetWorkspace();
    },
  });

  const hydrateWithWorkspace = useCallback(
    (state: WorkflowHydrationInput) => {
      hydrate(state);
      hydrateWorkspaceState(state);
    },
    [hydrate, hydrateWorkspaceState],
  );

  const abortActiveExecution = useCallback(() => {
    executionAbortRef.current?.abort();
    executionAbortRef.current = null;
    executionTokenRef.current += 1;
    isExecutingRef.current = false;
    setIsExecuting(false);
    setExecutionNodeStatus({});
    setWorkspaceInternal((prev) => {
      if (!prev.activeExecutionId) return prev;
      const next = { ...prev, activeExecutionId: null };
      workspaceRef.current = next;
      return next;
    });
  }, []);

  const setActiveWorkflowId = useCallback(
    (workflowId: string | null): WorkflowWorkspaceState => {
      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = setActiveWorkflow(prev, workflowId);
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
    },
    [syncToPersistLayer],
  );

  const selectWorkflow = useCallback(
    (workflowId: string) => {
      if (workspaceRef.current.activeExecutionId) {
        abortActiveExecution();
      }
      setActiveWorkflowId(workflowId);
    },
    [abortActiveExecution, setActiveWorkflowId],
  );

  const createWorkflow = useCallback(
    (input: CreateWorkflowInput): WorkflowDefinition | null => {
      const trimmedName = input.name.trim();
      if (!trimmedName) return null;

      let created: WorkflowDefinition | null = null;
      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = createWorkflowDefinition(prev, input);
        workspaceRef.current = nextWorkspace;
        const activeId = nextWorkspace.activeWorkflowId;
        created = activeId ? getWorkflowById(nextWorkspace, activeId) : null;
        return nextWorkspace;
      });

      syncToPersistLayer(nextWorkspace);
      return created;
    },
    [syncToPersistLayer],
  );

  const updateWorkflow = useCallback(
    (
      workflowId: string,
      patch: UpdateWorkflowPatch,
    ): WorkflowWorkspaceState => {
      const prev = workspaceRef.current;
      const current = getWorkflowById(prev, workflowId);
      const candidate = updateWorkflowDefinition(prev, workflowId, patch);
      const next = getWorkflowById(candidate, workflowId);

      if (
        current &&
        next &&
        isSameWorkflowGraph(current, next) &&
        current.name === next.name &&
        current.description === next.description
      ) {
        return prev;
      }

      workspaceRef.current = candidate;
      setWorkspaceInternal(candidate);
      return syncToPersistLayer(candidate);
    },
    [syncToPersistLayer],
  );

  const addNode = useCallback(
    (
      input: AddWorkflowNodeInput,
      workflowId?: string | null,
    ): WorkflowWorkspaceState => {
      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = addWorkflowNode(prev, input, workflowId);
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
    },
    [syncToPersistLayer],
  );

  const deleteWorkflow = useCallback(
    (workflowId?: string | null): WorkflowWorkspaceState => {
      const targetId = workflowId ?? workspaceRef.current.activeWorkflowId;
      if (!targetId) return workspaceRef.current;

      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = removeWorkflowDefinition(prev, targetId);
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
    },
    [syncToPersistLayer],
  );

  const deleteNode = useCallback(
    (
      nodeId: string,
      workflowId?: string | null,
    ): WorkflowWorkspaceState => {
      const targetId = workflowId ?? workspaceRef.current.activeWorkflowId;
      if (!targetId) return workspaceRef.current;

      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = removeWorkflowNode(prev, targetId, nodeId);
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
    },
    [syncToPersistLayer],
  );

  const beginRegenerate = useCallback(() => {
    setIsExecuting(false);
    clearErrorDetail();
    updateWorkspace({ error: undefined });
  }, [clearErrorDetail, updateWorkspace]);

  const importWorkflowFromStreamPayload = useCallback(
    (payload: WorkflowStreamPayload): WorkflowDefinition | null => {
      console.info("[workflow:import] received payload", {
        name: payload.name,
        nodeCount: payload.nodes?.length ?? 0,
        edgeCount: payload.edges?.length ?? 0,
      });

      if (!payload.nodes?.length) {
        console.warn("[workflow:import] rejected — empty nodes array", payload);
        return null;
      }

      const definition = workflowPayloadToDefinition(payload);
      const prev = normalizeWorkflowWorkspace(workspaceRef.current);
      const hasActiveWorkflow = Boolean(prev.activeWorkflowId && prev.workflows.length > 0);
      const importedWorkspace = hasActiveWorkflow
        ? applyWorkflowChatEdit(prev, {
            name: definition.name,
            description: definition.description,
            nodes: definition.nodes,
            edges: definition.edges,
            activate: true,
          })
        : importWorkflowFromStream(prev, {
            name: definition.name,
            description: definition.description,
            nodes: definition.nodes,
            edges: definition.edges,
            activate: true,
          });

      const normalized = normalizeWorkflowWorkspace({
        ...importedWorkspace,
        chatDiscoveryPending: false,
        error: undefined,
      });
      const activeId = normalized.activeWorkflowId;
      const created = activeId ? getWorkflowById(normalized, activeId) : null;

      if (!created) {
        console.warn("[workflow:import] workspace updated but no active workflow", {
          activeWorkflowId: activeId,
          workflowCount: normalized.workflows.length,
        });
        return null;
      }

      setIsExecuting(false);
      clearErrorDetail();
      syncToPersistLayer(normalized, { force: true });

      console.info("[workflow:import] success", {
        workflowId: created.id,
        workflowName: created.name,
        nodeCount: created.nodes.length,
        edgeCount: created.edges.length,
        activeWorkflowId: normalized.activeWorkflowId,
      });

      return created;
    },
    [clearErrorDetail, syncToPersistLayer],
  );

  const applyStreamError = useCallback(
    (
      errorCode: WorkflowErrorCode,
      message?: string | null,
    ): WorkflowWorkspaceState => {
      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = setWorkflowWorkspaceError(prev, errorCode);
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      setIsExecuting(false);
      setErrorDetail(message ?? null);
      return syncToPersistLayer(nextWorkspace);
    },
    [setErrorDetail, syncToPersistLayer],
  );

  const importLatestGeneratedWorkflow = useCallback(
    (locale: Locale): WorkflowDefinition | null => {
      const source = lastGeneratedWorkflowSourceRef.current;
      if (!source?.trim()) return null;

      const parsed = parseWorkflowFromResponse(source, locale, {
        logScope: "client",
      });
      if (!parsed.workflow) {
        applyStreamError(parsed.error ?? "parse_failed", null);
        return null;
      }

      return importWorkflowFromStreamPayload(parsed.workflow);
    },
    [applyStreamError, importWorkflowFromStreamPayload],
  );

  const hasImportableGeneratedWorkflow = useMemo(() => {
    if (!lastGeneratedWorkflowSource?.trim()) return false;
    return Boolean(
      parseWorkflowFromResponse(lastGeneratedWorkflowSource, "en").workflow,
    );
  }, [lastGeneratedWorkflowSource]);

  const applyTemplate = useCallback(
    (
      template: WorkflowTemplate,
      options?: {
        locale?: Locale;
        mode?: WorkflowTemplateApplyMode;
        activate?: boolean;
      },
    ): WorkflowTemplateApplyResult => {
      const locale = options?.locale ?? "id";
      const resolved = resolveWorkflowTemplate(template, locale);

      if (!resolved.nodes.length) {
        return { workflow: null, error: "empty_template" };
      }

      const prev = normalizeWorkflowWorkspace(workspaceRef.current);
      const nextWorkspace = applyWorkflowTemplateToWorkspace(
        prev,
        {
          name: resolved.name.trim() || resolved.title,
          description: resolved.workflowDescription,
          nodes: resolved.nodes,
          edges: resolved.edges,
        },
        {
          mode: options?.mode ?? "replace",
          activate: options?.activate ?? true,
        },
      );

      const activeId = nextWorkspace.activeWorkflowId;
      const workflow = activeId ? getWorkflowById(nextWorkspace, activeId) : null;

      if (!workflow || workflow.nodes.length === 0) {
        return { workflow: null, error: "apply_failed" };
      }

      workspaceRef.current = nextWorkspace;
      setWorkspaceInternal(nextWorkspace);
      syncToPersistLayer(nextWorkspace, { force: true });
      return { workflow };
    },
    [syncToPersistLayer],
  );

  const exportActiveWorkflowJson = useCallback((): string | null => {
    const workflow = getActiveWorkflow(workspaceRef.current);
    if (!workflow) return null;

    return serializeWorkflowForExport({
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes,
      edges: workflow.edges,
    });
  }, []);

  const importWorkflowJson = useCallback(
    (
      raw: string,
      options?: { mode?: WorkflowTemplateApplyMode },
    ): WorkflowTemplateApplyResult => {
      const parsed = parseWorkflowImportJson(raw);
      if (!parsed) {
        return { workflow: null, error: "invalid_graph" };
      }

      const prev = normalizeWorkflowWorkspace(workspaceRef.current);
      const nextWorkspace = applyWorkflowTemplateToWorkspace(prev, parsed, {
        mode: options?.mode ?? "replace",
        activate: true,
      });

      const activeId = nextWorkspace.activeWorkflowId;
      const workflow = activeId ? getWorkflowById(nextWorkspace, activeId) : null;

      if (!workflow || workflow.nodes.length === 0) {
        return { workflow: null, error: "apply_failed", fixes: parsed.fixes };
      }

      workspaceRef.current = nextWorkspace;
      setWorkspaceInternal(nextWorkspace);
      syncToPersistLayer(nextWorkspace, { force: true });
      return { workflow, fixes: parsed.fixes };
    },
    [syncToPersistLayer],
  );

  const executeWorkflow = useCallback(
    async (
      workflowId?: string | null,
      options?: { locale?: Locale; sessionId?: string },
    ): Promise<WorkflowExecutionResult | null> => {
      if (isExecutingRef.current || workspaceRef.current.activeExecutionId) {
        return null;
      }

      const activeId = workspaceRef.current.activeWorkflowId;
      if (!activeId) return null;

      if (workflowId && workflowId !== activeId) {
        return null;
      }

      const targetId = activeId;
      const workflow = getWorkflowById(workspaceRef.current, targetId);
      if (!workflow) return null;

      executionAbortRef.current?.abort();
      executionAbortRef.current = null;

      const executionToken = executionTokenRef.current + 1;
      executionTokenRef.current = executionToken;
      const abortController = new AbortController();
      executionAbortRef.current = abortController;

      isExecutingRef.current = true;
      setIsExecuting(true);
      clearErrorDetail();
      setExecutionNodeStatus({});
      setMultiAgentActivities([]);

      const startedAt = Date.now();
      const runningExecution: WorkflowExecutionResult = {
        workflowId: targetId,
        status: "running",
        startedAt,
        logs: [],
      };

      setWorkspaceInternal((prev) => ({
        ...prev,
        activeExecutionId: targetId,
        lastExecution: runningExecution,
        executionCheckpoint: null,
        error: undefined,
        updatedAt: Date.now(),
      }));

      const isCurrentExecution = () =>
        executionTokenRef.current === executionToken &&
        workspaceRef.current.activeExecutionId === targetId;

      try {
        const response = await fetch("/api/workflow/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            workflow,
            locale: options?.locale ?? "id",
            sessionId: options?.sessionId,
            activeWorkflowId: targetId,
          }),
        });

        if (!isCurrentExecution()) {
          return null;
        }

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          const httpError = new Error(
            data.error ?? "Workflow execution failed.",
          ) as Error & { status?: number };
          httpError.status = response.status;
          throw httpError;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/event-stream")) {
          throw new Error("Workflow execution stream is not available.");
        }

        const applyProgress = (logs: WorkflowExecutionLogEntry[]) => {
          if (!isCurrentExecution()) return;

          const statusMap: Record<string, WorkflowExecutionLogEntry["status"]> =
            {};
          for (const log of logs) {
            statusMap[log.nodeId] = log.status;
          }
          setExecutionNodeStatus(statusMap);
          setWorkspaceInternal((prev) => ({
            ...prev,
            activeExecutionId: targetId,
            lastExecution: {
              workflowId: targetId,
              status: "running",
              startedAt,
              logs: [...logs],
            },
            updatedAt: Date.now(),
          }));
        };

        const persistCheckpoint = (checkpoint: WorkflowExecutionCheckpoint) => {
          if (!isCurrentExecution()) return;
          setWorkspaceInternal((prev) => {
            const next = {
              ...prev,
              executionCheckpoint: checkpoint,
              updatedAt: Date.now(),
            };
            workspaceRef.current = next;
            return next;
          });
        };

        const { result, checkpoint } = await consumeWorkflowExecuteStream(
          response,
          {
            onProgress: ({ logs }) => {
              applyProgress(logs);
            },
            onAgentActivity: ({ activities }) => {
              if (!isCurrentExecution()) return;
              setMultiAgentActivities([...activities]);
            },
            onToolAction: async (payload) => {
              applyProgress(payload.logs);

              if (!isCurrentExecution()) return;

              const bridge = toolCoordinatorBridgeRef.current;
              if (!bridge) return;

              try {
                const clientResult = await executeClientWorkflowAction(
                  bridge,
                  payload.action,
                  payload.dispatch,
                );

                if (!isCurrentExecution()) return;

                setWorkspaceInternal((prev) => {
                  const logs = prev.lastExecution?.logs ?? [];
                  const patchedLogs = logs.map((log) =>
                    log.nodeId === payload.nodeId
                      ? {
                          ...log,
                          message: clientResult.success
                            ? `${log.message ?? ""} ${clientResult.message}`.trim()
                            : clientResult.message,
                          output: clientResult.output || log.output,
                        }
                      : log,
                  );

                  return {
                    ...prev,
                    lastExecution: {
                      workflowId: targetId,
                      status: "running",
                      startedAt,
                      logs: patchedLogs,
                    },
                    updatedAt: Date.now(),
                  };
                });
              } catch (error) {
                console.error("[workflow:tool_action]", error);
              }
            },
            onApprovalRequired: ({ checkpoint: pauseCheckpoint, logs }) => {
              applyProgress(logs);
              persistCheckpoint(pauseCheckpoint);
            },
            onRecoveryRequired: ({ checkpoint: pauseCheckpoint, logs }) => {
              applyProgress(logs);
              persistCheckpoint(pauseCheckpoint);
            },
            onScheduled: ({ logs }) => {
              applyProgress(logs);
            },
          },
        );

        if (!isCurrentExecution()) {
          return null;
        }

        const isPaused =
          result.status === "paused" || result.status === "awaiting_approval";

        let nextWorkspace!: WorkflowWorkspaceState;

        setWorkspaceInternal((prev) => {
          nextWorkspace = {
            ...prev,
            activeExecutionId: null,
            lastExecution: result,
            executionCheckpoint:
              isPaused && checkpoint ? checkpoint : null,
            error: result.status === "failed" ? "execute_failed" : undefined,
            updatedAt: Date.now(),
          };
          workspaceRef.current = nextWorkspace;
          return nextWorkspace;
        });

        if (result.logs?.length) {
          const statusMap: Record<string, WorkflowExecutionLogEntry["status"]> =
            {};
          for (const log of result.logs) {
            statusMap[log.nodeId] = log.status;
          }
          setExecutionNodeStatus(statusMap);
        }

        if (result.status === "failed") {
          setErrorDetail(result.message ?? result.error ?? null);
        } else {
          clearErrorDetail();
        }

        syncToPersistLayer(nextWorkspace);
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }

        if (!isCurrentExecution()) {
          return null;
        }

        const httpStatus =
          error instanceof Error
            ? (error as Error & { status?: number }).status
            : undefined;
        const message = resolveWorkflowErrorMessage(
          options?.locale ?? "id",
          {
            code: "execute_failed",
            message:
              error instanceof Error ? error.message : "Workflow execution failed.",
            httpStatus,
          },
        );

        const failedResult: WorkflowExecutionResult = {
          workflowId: targetId,
          status: "failed",
          startedAt,
          completedAt: Date.now(),
          message,
          logs: workspaceRef.current.lastExecution?.logs ?? [],
          error: "execute_failed",
        };

        let nextWorkspace!: WorkflowWorkspaceState;

        setWorkspaceInternal((prev) => {
          nextWorkspace = setWorkflowWorkspaceError(prev, "execute_failed");
          nextWorkspace = {
            ...nextWorkspace,
            activeExecutionId: null,
            lastExecution: failedResult,
          };
          workspaceRef.current = nextWorkspace;
          return nextWorkspace;
        });

        setErrorDetail(message);
        syncToPersistLayer(nextWorkspace);
        return failedResult;
      } finally {
        if (executionTokenRef.current === executionToken) {
          isExecutingRef.current = false;
          setIsExecuting(false);
          executionAbortRef.current = null;
          setWorkspaceInternal((prev) => {
            if (!prev.activeExecutionId) return prev;
            const next = { ...prev, activeExecutionId: null };
            workspaceRef.current = next;
            return next;
          });
        }
      }
    },
    [clearErrorDetail, setErrorDetail, syncToPersistLayer],
  );

  const resumeWorkflow = useCallback(
    async (
      action: WorkflowResumeAction,
      note?: string,
      options?: { locale?: Locale; sessionId?: string },
    ): Promise<WorkflowExecutionResult | null> => {
      if (isExecutingRef.current || workspaceRef.current.activeExecutionId) {
        return null;
      }

      const checkpoint = workspaceRef.current.executionCheckpoint;
      const activeId = workspaceRef.current.activeWorkflowId;
      if (!checkpoint || !activeId || checkpoint.workflowId !== activeId) {
        return null;
      }

      const workflow = getWorkflowById(workspaceRef.current, activeId);
      if (!workflow) return null;

      executionAbortRef.current?.abort();
      executionAbortRef.current = null;

      const executionToken = executionTokenRef.current + 1;
      executionTokenRef.current = executionToken;
      const abortController = new AbortController();
      executionAbortRef.current = abortController;

      isExecutingRef.current = true;
      setIsExecuting(true);
      clearErrorDetail();

      const targetId = activeId;
      const startedAt = checkpoint.startedAt;

      setWorkspaceInternal((prev) => ({
        ...prev,
        activeExecutionId: targetId,
        lastExecution: {
          workflowId: targetId,
          status: "running",
          startedAt,
          logs: checkpoint.logs,
        },
        updatedAt: Date.now(),
      }));

      const isCurrentExecution = () =>
        executionTokenRef.current === executionToken &&
        workspaceRef.current.activeExecutionId === targetId;

      try {
        const response = await fetch("/api/workflow/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            workflow,
            checkpoint,
            action,
            note: note?.trim() || undefined,
            locale: options?.locale ?? checkpoint.locale,
            sessionId: options?.sessionId,
            activeWorkflowId: targetId,
          }),
        });

        if (!isCurrentExecution()) return null;

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          const httpError = new Error(
            data.error ?? "Workflow resume failed.",
          ) as Error & { status?: number };
          httpError.status = response.status;
          throw httpError;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/event-stream")) {
          throw new Error("Workflow resume stream is not available.");
        }

        const applyProgress = (logs: WorkflowExecutionLogEntry[]) => {
          if (!isCurrentExecution()) return;

          const statusMap: Record<string, WorkflowExecutionLogEntry["status"]> =
            {};
          for (const log of logs) {
            statusMap[log.nodeId] = log.status;
          }
          setExecutionNodeStatus(statusMap);
          setWorkspaceInternal((prev) => ({
            ...prev,
            activeExecutionId: targetId,
            lastExecution: {
              workflowId: targetId,
              status: "running",
              startedAt,
              logs: [...logs],
            },
            updatedAt: Date.now(),
          }));
        };

        const persistCheckpoint = (nextCheckpoint: WorkflowExecutionCheckpoint) => {
          if (!isCurrentExecution()) return;
          setWorkspaceInternal((prev) => {
            const next = {
              ...prev,
              executionCheckpoint: nextCheckpoint,
              updatedAt: Date.now(),
            };
            workspaceRef.current = next;
            return next;
          });
        };

        const { result, checkpoint: nextCheckpoint } =
          await consumeWorkflowExecuteStream(response, {
            onProgress: ({ logs }) => applyProgress(logs),
            onAgentActivity: ({ activities }) => {
              if (!isCurrentExecution()) return;
              setMultiAgentActivities([...activities]);
            },
            onToolAction: async (payload) => {
              applyProgress(payload.logs);
              if (!isCurrentExecution()) return;

              const bridge = toolCoordinatorBridgeRef.current;
              if (!bridge) return;

              try {
                const clientResult = await executeClientWorkflowAction(
                  bridge,
                  payload.action,
                  payload.dispatch,
                );

                if (!isCurrentExecution()) return;

                setWorkspaceInternal((prev) => {
                  const logs = prev.lastExecution?.logs ?? [];
                  const patchedLogs = logs.map((log) =>
                    log.nodeId === payload.nodeId
                      ? {
                          ...log,
                          message: clientResult.success
                            ? `${log.message ?? ""} ${clientResult.message}`.trim()
                            : clientResult.message,
                          output: clientResult.output || log.output,
                        }
                      : log,
                  );

                  return {
                    ...prev,
                    lastExecution: {
                      workflowId: targetId,
                      status: "running",
                      startedAt,
                      logs: patchedLogs,
                    },
                    updatedAt: Date.now(),
                  };
                });
              } catch (error) {
                console.error("[workflow:tool_action]", error);
              }
            },
            onApprovalRequired: ({ checkpoint: pauseCheckpoint, logs }) => {
              applyProgress(logs);
              persistCheckpoint(pauseCheckpoint);
            },
            onRecoveryRequired: ({ checkpoint: pauseCheckpoint, logs }) => {
              applyProgress(logs);
              persistCheckpoint(pauseCheckpoint);
            },
            onScheduled: ({ logs }) => applyProgress(logs),
          });

        if (!isCurrentExecution()) return null;

        const isPaused =
          result.status === "paused" || result.status === "awaiting_approval";

        let nextWorkspace!: WorkflowWorkspaceState;

        setWorkspaceInternal((prev) => {
          nextWorkspace = {
            ...prev,
            activeExecutionId: null,
            lastExecution: result,
            executionCheckpoint:
              isPaused && nextCheckpoint ? nextCheckpoint : null,
            error: result.status === "failed" ? "execute_failed" : undefined,
            updatedAt: Date.now(),
          };
          workspaceRef.current = nextWorkspace;
          return nextWorkspace;
        });

        if (result.logs?.length) {
          const statusMap: Record<string, WorkflowExecutionLogEntry["status"]> =
            {};
          for (const log of result.logs) {
            statusMap[log.nodeId] = log.status;
          }
          setExecutionNodeStatus(statusMap);
        }

        if (result.status === "failed") {
          setErrorDetail(result.message ?? result.error ?? null);
        } else {
          clearErrorDetail();
        }

        syncToPersistLayer(nextWorkspace);
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }

        if (!isCurrentExecution()) return null;

        const httpStatus =
          error instanceof Error
            ? (error as Error & { status?: number }).status
            : undefined;
        const message = resolveWorkflowErrorMessage(
          options?.locale ?? checkpoint.locale,
          {
            code: "execute_failed",
            message:
              error instanceof Error ? error.message : "Workflow resume failed.",
            httpStatus,
          },
        );

        const failedResult: WorkflowExecutionResult = {
          workflowId: targetId,
          status: "failed",
          startedAt,
          completedAt: Date.now(),
          message,
          logs: workspaceRef.current.lastExecution?.logs ?? checkpoint.logs,
          error: "execute_failed",
        };

        let nextWorkspace!: WorkflowWorkspaceState;

        setWorkspaceInternal((prev) => {
          nextWorkspace = setWorkflowWorkspaceError(prev, "execute_failed");
          nextWorkspace = {
            ...nextWorkspace,
            activeExecutionId: null,
            lastExecution: failedResult,
          };
          workspaceRef.current = nextWorkspace;
          return nextWorkspace;
        });

        setErrorDetail(message);
        syncToPersistLayer(nextWorkspace);
        return failedResult;
      } finally {
        if (executionTokenRef.current === executionToken) {
          isExecutingRef.current = false;
          setIsExecuting(false);
          executionAbortRef.current = null;
          setWorkspaceInternal((prev) => {
            if (!prev.activeExecutionId) return prev;
            const next = { ...prev, activeExecutionId: null };
            workspaceRef.current = next;
            return next;
          });
        }
      }
    },
    [clearErrorDetail, setErrorDetail, syncToPersistLayer],
  );

  const setChatDiscoveryPending = useCallback(
    (pending: boolean): WorkflowWorkspaceState => {
      const next = applyWorkspacePatch(workspaceRef.current, {
        chatDiscoveryPending: pending,
        updatedAt: Date.now(),
      });
      workspaceRef.current = next;
      setWorkspaceInternal(next);
      syncToPersistLayer(next);
      return next;
    },
    [syncToPersistLayer],
  );

  const buildWorkflowChatContextForSend = useCallback(
    (messages?: import("@/lib/types").IdaMessage[]): WorkflowChatContext => {
      const ws = workspaceRef.current;
      const activeWorkflow = ws.activeWorkflowId
        ? getWorkflowById(ws, ws.activeWorkflowId)
        : null;
      return buildWorkflowChatContext({
        workspace: ws,
        activeWorkflow,
        messages,
      });
    },
    [],
  );

  const clearExecutionCheckpoint = useCallback((): WorkflowWorkspaceState => {
    const next = applyWorkspacePatch(workspaceRef.current, {
      executionCheckpoint: null,
      updatedAt: Date.now(),
    });
    workspaceRef.current = next;
    setWorkspaceInternal(next);
    syncToPersistLayer(next);
    return next;
  }, [syncToPersistLayer]);

  const workflows = useMemo(() => workspace.workflows, [workspace.workflows]);
  const activeWorkflowId = workspace.activeWorkflowId;
  const activeExecutionId = workspace.activeExecutionId ?? null;
  const activeWorkflow = useMemo(
    () => getActiveWorkflow(workspace),
    [workspace],
  );
  const lastExecution = workspace.lastExecution ?? null;
  const executionCheckpoint = workspace.executionCheckpoint ?? null;
  const quotaSnapshot = useMemo(() => ({ ...quota }), [quota]);
  const workspaceSnapshot = useMemo(() => ({ ...workspace, workflows }), [
    workspace,
    workflows,
  ]);

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    quota: quotaSnapshot,
    workspace: workspaceSnapshot,
    workflows,
    activeWorkflowId,
    activeExecutionId,
    activeWorkflow,
    isExecuting,
    executionNodeStatus,
    multiAgentActivities,
    lastExecution,
    errorDetail,
    setErrorDetail,
    clearErrorDetail,
    getWorkspace,
    setWorkspace,
    updateWorkspace,
    hydrateFromExternal,
    syncToPersistLayer,
    registerSyncToPersistLayer,
    registerToolCoordinatorBridge,
    setActiveWorkflowId,
    selectWorkflow,
    createWorkflow,
    updateWorkflow,
    addNode,
    beginRegenerate,
    importWorkflowFromStream: importWorkflowFromStreamPayload,
    lastGeneratedWorkflowSource,
    setLastGeneratedWorkflowSource,
    hasImportableGeneratedWorkflow,
    importLatestGeneratedWorkflow,
    applyStreamError,
    executeWorkflow,
    resumeWorkflow,
    executionCheckpoint,
    clearExecutionCheckpoint,
    buildWorkflowChatContext: buildWorkflowChatContextForSend,
    setChatDiscoveryPending,
    deleteWorkflow,
    deleteNode,
    applyTemplate,
    exportActiveWorkflowJson,
    importWorkflowJson,
    resetWorkspace,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate: hydrateWithWorkspace,
    resetForNewChat,
  };
}