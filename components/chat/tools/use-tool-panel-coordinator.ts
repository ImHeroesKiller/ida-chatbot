"use client";

import { useCallback, useMemo } from "react";

import {
  closeAllPanelControllers,
  openExclusivePanel,
  resolveActivePanel,
  type PanelController,
} from "@/components/chat/tools/coordinator-helpers";
import type { ToolRuntimeEntry } from "@/components/chat/tools/tool-coordinator-config";
import type { RightSidebarPanel } from "@/lib/chat-tools";

export function useToolPanelCoordinator(entries: ToolRuntimeEntry[]) {
  const panelControllers = useMemo(
    () => entries.map((entry) => entry.tool as PanelController),
    [entries],
  );

  const activePanel = useMemo(
    () => resolveActivePanel(panelControllers),
    // Re-resolve when any tool opens or closes its panel (tool refs are stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    entries.map((entry) => entry.tool.isPanelOpen),
  );

  /** Close every tool sidebar panel; armed flags are unchanged. */
  const closeAllPanels = useCallback(() => {
    closeAllPanelControllers(panelControllers);
  }, [panelControllers]);

  /** Open one panel and close all others (mutual exclusion). */
  const openPanel = useCallback(
    (panel: RightSidebarPanel) => {
      openExclusivePanel(panelControllers, panel);
    },
    [panelControllers],
  );

  /** Toggle a panel: close if already active, otherwise open exclusively. */
  const togglePanel = useCallback(
    (panel: RightSidebarPanel) => {
      if (activePanel === panel) {
        closeAllPanels();
        return;
      }
      openPanel(panel);
    },
    [activePanel, closeAllPanels, openPanel],
  );

  /** Collapse the active sidebar panel without changing armed flags. */
  const collapsePanel = useCallback(() => {
    closeAllPanels();
  }, [closeAllPanels]);

  return {
    activePanel,
    openPanel,
    togglePanel,
    collapsePanel,
    closeAllPanels,
  };
}