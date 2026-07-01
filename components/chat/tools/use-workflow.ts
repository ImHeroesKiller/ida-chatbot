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
import type { Locale } from "@/lib/config";
import {
  parseWorkflowFromResponse,
  workflowPayloadToDefinition,
  type WorkflowStreamPayload,
} from "@/lib/workflow-chat";
import {
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
  type WorkflowExecutionResult,
  type WorkflowWorkspace,
} from "@/lib/workflow";

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
    activeWorkflow: WorkflowDefinition | null;
    isExecuting: boolean;
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
    deleteWorkflow: (workflowId?: string | null) => WorkflowWorkspaceState;
    deleteNode: (
      nodeId: string,
      workflowId?: string | null,
    ) => WorkflowWorkspaceState;
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
  const [errorDetail, setErrorDetailState] = useState<string | null>(null);
  const errorDetailRef = useRef<string | null>(null);
  const persistSyncRef = useRef<PersistLayerSync | null>(null);
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
      setActiveWorkflowId(workflowId);
    },
    [setActiveWorkflowId],
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
      const importedWorkspace = importWorkflowFromStream(workspaceRef.current, {
        name: definition.name,
        description: definition.description,
        nodes: definition.nodes,
        edges: definition.edges,
        activate: true,
      });

      const normalized = normalizeWorkflowWorkspace(importedWorkspace);
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

  const executeWorkflow = useCallback(
    async (
      workflowId?: string | null,
      options?: { locale?: Locale; sessionId?: string },
    ): Promise<WorkflowExecutionResult | null> => {
      const targetId = workflowId ?? workspaceRef.current.activeWorkflowId;
      if (!targetId) return null;

      const workflow = getWorkflowById(workspaceRef.current, targetId);
      if (!workflow) return null;

      setIsExecuting(true);
      clearErrorDetail();

      try {
        const response = await fetch("/api/workflow/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow,
            locale: options?.locale ?? "id",
            sessionId: options?.sessionId,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          result?: WorkflowExecutionResult;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Workflow execution failed.");
        }

        const result = data.result;
        if (!result) {
          throw new Error("Workflow execution returned no result.");
        }

        let nextWorkspace!: WorkflowWorkspaceState;

        setWorkspaceInternal((prev) => {
          nextWorkspace = {
            ...prev,
            lastExecution: result,
            error: result.status === "failed" ? "execute_failed" : undefined,
            updatedAt: Date.now(),
          };
          workspaceRef.current = nextWorkspace;
          return nextWorkspace;
        });

        if (result.status === "failed") {
          setErrorDetail(result.message ?? result.error ?? null);
        }

        syncToPersistLayer(nextWorkspace);
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Workflow execution failed.";

        const failedResult: WorkflowExecutionResult = {
          workflowId: targetId,
          status: "failed",
          startedAt: Date.now(),
          completedAt: Date.now(),
          message,
          logs: [],
          error: "execute_failed",
        };

        let nextWorkspace!: WorkflowWorkspaceState;

        setWorkspaceInternal((prev) => {
          nextWorkspace = setWorkflowWorkspaceError(prev, "execute_failed");
          nextWorkspace = {
            ...nextWorkspace,
            lastExecution: failedResult,
          };
          workspaceRef.current = nextWorkspace;
          return nextWorkspace;
        });

        setErrorDetail(message);
        syncToPersistLayer(nextWorkspace);
        return failedResult;
      } finally {
        setIsExecuting(false);
      }
    },
    [clearErrorDetail, setErrorDetail, syncToPersistLayer],
  );

  const workflows = useMemo(() => workspace.workflows, [workspace.workflows]);
  const activeWorkflowId = workspace.activeWorkflowId;
  const activeWorkflow = useMemo(
    () => getActiveWorkflow(workspace),
    [workspace],
  );
  const lastExecution = workspace.lastExecution ?? null;
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
    activeWorkflow,
    isExecuting,
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
    deleteWorkflow,
    deleteNode,
    resetWorkspace,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate: hydrateWithWorkspace,
    resetForNewChat,
  };
}