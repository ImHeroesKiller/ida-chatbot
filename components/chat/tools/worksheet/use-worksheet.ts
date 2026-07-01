"use client";

import { useCallback, useMemo, useState } from "react";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { ToolQuotaState } from "@/components/chat/tools/types";

import { createWorksheetQuotaState } from "./worksheet-quota";

const PANEL_ID = TOOL_PANEL_IDS.worksheet;

export type WorksheetTool = BaseToolState &
  BaseToolLifecycle & {
    /** Placeholder quota state — not enforced until account management exists. */
    quota: ToolQuotaState;
  };

/**
 * Worksheet tool hook — implements `BaseToolState` and is registered via
 * `useToolsCoordinator` → `useToolRuntime`. Document workspace state remains
 * in `useWorksheetWorkspace` / `worksheet-panel.tsx` for now; this hook only
 * tracks armed/panel lifecycle until Phase 3 migration completes.
 */
export function useWorksheet(): WorksheetTool {
  const [quota, setQuota] = useState<ToolQuotaState>(createWorksheetQuotaState);

  const resetQuota = useCallback(() => {
    setQuota(createWorksheetQuotaState());
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
  } = useBaseToolState(PANEL_ID, {
    onReset: resetQuota,
  });

  const quotaSnapshot = useMemo(() => ({ ...quota }), [quota]);

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    quota: quotaSnapshot,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  };
}