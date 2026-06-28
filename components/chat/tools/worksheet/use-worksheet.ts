"use client";

import { useCallback, useState } from "react";

import {
  createBaseToolActions,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";

const PANEL_ID = TOOL_PANEL_IDS.worksheet;

export function useWorksheet(): BaseToolState & {
  hydrate: (state: ToolHydrationInput) => void;
  resetForNewChat: () => void;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const { setEnabled, openPanel, closePanel, toggleTool } = createBaseToolActions(
    {
      setIsEnabled,
      setIsPanelOpen,
    },
  );

  const hydrate = useCallback((state: ToolHydrationInput) => {
    setIsEnabled(state.enabled);
    setIsPanelOpen(Boolean(state.panelOpen));
  }, []);

  const resetForNewChat = useCallback(() => {
    setIsEnabled(false);
    setIsPanelOpen(false);
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