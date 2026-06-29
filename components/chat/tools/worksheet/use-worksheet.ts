"use client";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";

const PANEL_ID = TOOL_PANEL_IDS.worksheet;

export type WorksheetTool = BaseToolState & BaseToolLifecycle;

/**
 * Manages worksheet tool armed/panel state.
 *
 * Worksheet content (documents, workspace) lives in the chat session — this hook
 * only tracks whether the tool is enabled and whether its panel is open.
 */
export function useWorksheet(): WorksheetTool {
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
  } = useBaseToolState(PANEL_ID);

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  };
}