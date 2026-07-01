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
import {
  addWorkflowNode,
  areWorkflowWorkspaceSnapshotsEqual,
  buildWorkflowWorkspacePersistFingerprint,
  createEmptyWorkflowWorkspace,
  createWorkflowDefinition,
  getActiveWorkflow,
  getWorkflowById,
  normalizeWorkflowWorkspace,
  removeWorkflowDefinition,
  removeWorkflowNode,
  setActiveWorkflow,
  updateWorkflowDefinition,
  type AddWorkflowNodeInput,
  type CreateWorkflowInput,
  type UpdateWorkflowPatch,
  type WorkflowDefinition,
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
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowNodeKind,
  WorkflowEdge,
  WorkflowWorkspace,
} from "@/lib/workflow";

/** Workspace snapshot persisted on `ChatSession.workflow`. */
export type WorkflowWorkspaceState = WorkflowWorkspace;

type PersistLayerSync = (workspace: WorkflowWorkspaceState) => void;

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
    /** Stub — records a completed execution locally; API wiring comes in a later phase. */
    executeWorkflow: (
      workflowId?: string | null,
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
  const persistSyncRef = useRef<PersistLayerSync | null>(null);
  const lastPersistedFingerprintRef = useRef<string | null>(null);

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
    (nextWorkspace?: WorkflowWorkspaceState): WorkflowWorkspaceState => {
      const current = nextWorkspace ?? getWorkspace();
      const snapshot = normalizeWorkflowWorkspace({
        ...current,
        updatedAt: Date.now(),
      });
      const fingerprint = buildWorkflowWorkspacePersistFingerprint(snapshot);

      if (fingerprint === lastPersistedFingerprintRef.current) {
        return snapshot;
      }

      lastPersistedFingerprintRef.current = fingerprint;
      persistSyncRef.current?.(snapshot);
      workspaceRef.current = snapshot;
      setWorkspaceInternal(snapshot);
      return snapshot;
    },
    [getWorkspace],
  );

  const resetQuota = useCallback(() => {
    setQuota(createWorkflowQuotaState());
  }, []);

  const resetWorkspace = useCallback(() => {
    const empty = createEmptyWorkflowWorkspace();
    workspaceRef.current = empty;
    setWorkspaceInternal(empty);
    setIsExecuting(false);
    resetPersistFingerprint();
  }, [resetPersistFingerprint]);

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
      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = updateWorkflowDefinition(prev, workflowId, patch);
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      return syncToPersistLayer(nextWorkspace);
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

  const executeWorkflow = useCallback(
    async (workflowId?: string | null): Promise<WorkflowExecutionResult | null> => {
      const targetId = workflowId ?? workspaceRef.current.activeWorkflowId;
      if (!targetId) return null;

      const workflow = getWorkflowById(workspaceRef.current, targetId);
      if (!workflow) return null;

      setIsExecuting(true);

      // Stub: local-only execution record until backend orchestration ships.
      await new Promise((resolve) => setTimeout(resolve, 400));

      const result: WorkflowExecutionResult = {
        workflowId: targetId,
        status: "completed",
        startedAt: Date.now(),
        completedAt: Date.now(),
        message: `Workflow "${workflow.name}" executed (stub).`,
      };

      let nextWorkspace!: WorkflowWorkspaceState;

      setWorkspaceInternal((prev) => {
        nextWorkspace = {
          ...prev,
          lastExecution: result,
          updatedAt: Date.now(),
        };
        workspaceRef.current = nextWorkspace;
        return nextWorkspace;
      });

      setIsExecuting(false);
      syncToPersistLayer(nextWorkspace);
      return result;
    },
    [syncToPersistLayer],
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