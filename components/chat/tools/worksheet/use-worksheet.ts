"use client";

import { useCallback, useState } from "react";

import {
  applyBaseHydration,
  createBaseToolActions,
  resetBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
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
  // --- Base state (shared across all tools) ---
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const baseSetters = { setIsEnabled, setIsPanelOpen };

  const { setEnabled, openPanel, closePanel, toggleTool } = createBaseToolActions(
    { ...baseSetters },
  );

  // --- Lifecycle (hydrate / reset) ---
  const hydrate = useCallback((state: ToolHydrationInput) => {
    applyBaseHydration(state, baseSetters);
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState(baseSetters);
  }, []);

  return {
    panelId: PANEL_ID,
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