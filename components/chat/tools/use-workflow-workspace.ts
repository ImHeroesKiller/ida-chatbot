"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { WorkflowWorkspaceState } from "@/components/chat/tools/use-workflow";
import { WORKSPACE_PERSIST_DEBOUNCE_MS } from "@/lib/client/debounce";
import type { ChatSession } from "@/lib/chat-store";
import {
  areWorkflowWorkspaceSnapshotsEqual,
  createEmptyWorkflowWorkspace,
  hasWorkflowWorkspaceContent,
  normalizeWorkflowWorkspace,
} from "@/lib/workflow";

/**
 * useWorkflowWorkspace — Pure Persist Layer
 *
 * Tanggung jawab:
 * - Persistensi mirror Workflow ke ChatSession
 * - Inbound sync dari Tool Hook via `setWorkflowWorkspaceInbound`
 *
 * BUKAN pusat mutasi. Semua mutasi canvas → `useWorkflow` (SSOT).
 *
 * Alur satu arah:
 *   Panel → useWorkflow → syncToPersistLayer → setWorkflowWorkspaceInbound → ChatSession
 *
 * Navigasi chat (bukan mutasi panel):
 *   hydrateFromChat → persist state + syncWorkspaceToTool (hydrateFromExternal)
 */
interface UseWorkflowWorkspaceOptions {
  hydrated: boolean;
  currentChat: ChatSession | null;
  canPersistCurrentChatState: () => boolean;
  persistCurrentChat: (patch: Partial<Pick<ChatSession, "workflow">>) => void;
  /** Outbound ke tool hook saat load chat / reset — bukan jalur mutasi panel. */
  syncWorkspaceToTool?: (workspace: WorkflowWorkspaceState) => void;
  /** Optional initial workspace snapshot from the tool hook. */
  getWorkspaceFromTool?: () => WorkflowWorkspaceState;
}

export function useWorkflowWorkspace({
  hydrated,
  currentChat,
  canPersistCurrentChatState,
  persistCurrentChat,
  syncWorkspaceToTool,
  getWorkspaceFromTool,
}: UseWorkflowWorkspaceOptions) {
  /** Mirror persist untuk ChatSession — runtime SSOT ada di useWorkflow. */
  const [workflowWorkspace, setWorkflowWorkspaceState] =
    useState<WorkflowWorkspaceState>(() => {
      const fromTool = getWorkspaceFromTool?.();
      if (fromTool && hasWorkflowWorkspaceContent(fromTool)) {
        return normalizeWorkflowWorkspace(fromTool);
      }
      return createEmptyWorkflowWorkspace();
    });
  const workflowWorkspaceRef = useRef<WorkflowWorkspaceState>(
    createEmptyWorkflowWorkspace(),
  );

  // LEGACY / FALLBACK — mutasi + echo ke tool hook. Jangan gunakan sebagai jalur utama.
  const applyWorkspace = useCallback(
    (next: SetStateAction<WorkflowWorkspaceState>) => {
      setWorkflowWorkspaceState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        const synced = normalizeWorkflowWorkspace(resolved);
        workflowWorkspaceRef.current = synced;
        syncWorkspaceToTool?.(synced);
        return synced;
      });
    },
    [syncWorkspaceToTool],
  ) as Dispatch<SetStateAction<WorkflowWorkspaceState>>;

  /**
   * Inbound mirror dari tool hook — update persist tanpa memicu hydrateFromExternal.
   * Dipasang via registerSyncToPersistLayer di chat-room.tsx.
   */
  const setWorkflowWorkspaceInbound = useCallback(
    (workspace: WorkflowWorkspaceState) => {
      const synced = normalizeWorkflowWorkspace(workspace);
      workflowWorkspaceRef.current = synced;
      setWorkflowWorkspaceState((prev) => {
        if (areWorkflowWorkspaceSnapshotsEqual(prev, synced)) {
          return prev;
        }
        return synced;
      });
    },
    [],
  );

  useEffect(() => {
    workflowWorkspaceRef.current = workflowWorkspace;
  }, [workflowWorkspace]);

  useEffect(() => {
    if (!hydrated || !currentChat) return;
    if (!canPersistCurrentChatState()) return;

    const buildWorkflow = () =>
      hasWorkflowWorkspaceContent(workflowWorkspace)
        ? normalizeWorkflowWorkspace({
            ...workflowWorkspace,
            updatedAt: Date.now(),
          })
        : createEmptyWorkflowWorkspace();

    const timer = window.setTimeout(() => {
      if (!canPersistCurrentChatState()) return;
      persistCurrentChat({ workflow: buildWorkflow() });
    }, WORKSPACE_PERSIST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      if (canPersistCurrentChatState()) {
        persistCurrentChat({ workflow: buildWorkflow() });
      }
    };
  }, [
    canPersistCurrentChatState,
    currentChat,
    hydrated,
    persistCurrentChat,
    workflowWorkspace,
  ]);

  /** Load workflow dari ChatSession — outbound ke tool hook, bukan mutasi panel. */
  const hydrateFromChat = useCallback(
    (chat: ChatSession) => {
      const workflow = normalizeWorkflowWorkspace(chat.workflow);
      workflowWorkspaceRef.current = workflow;
      setWorkflowWorkspaceState(workflow);
      syncWorkspaceToTool?.(workflow);
    },
    [syncWorkspaceToTool],
  );

  const resetForNewChat = useCallback(() => {
    const emptyWorkflow = createEmptyWorkflowWorkspace();
    workflowWorkspaceRef.current = emptyWorkflow;
    setWorkflowWorkspaceState(emptyWorkflow);
    syncWorkspaceToTool?.(emptyWorkflow);
  }, [syncWorkspaceToTool]);

  const handleWorkflowChange = useCallback(
    (workspace: WorkflowWorkspaceState) => {
      applyWorkspace(workspace);
    },
    [applyWorkspace],
  );

  return {
    workflowWorkspace,
    /** LEGACY / FALLBACK alias untuk applyWorkspace. */
    setWorkflowWorkspace: applyWorkspace,
    setWorkflowWorkspaceInbound,
    workflowWorkspaceRef,
    hydrateFromChat,
    resetForNewChat,
    handleWorkflowChange,
  };
}