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
    // Re-resolve when any tool opens or closes its *modal* (previously sidebar "panel").
    // Tool refs are stable. eslint exception intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    entries.map((entry) => entry.tool.isPanelOpen),
  );

  /** Close every tool modal (previously: sidebar panel); armed flags unchanged. */
  const closeAllPanels = useCallback(() => {
    closeAllPanelControllers(panelControllers);
  }, [panelControllers]);

  /** Open one tool's UI as modal and close others (mutual exclusion). */
  const openPanel = useCallback(
    (panel: RightSidebarPanel) => {
      openExclusivePanel(panelControllers, panel);
    },
    [panelControllers],
  );

  /** Toggle tool modal: close if active, else open exclusively. */
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

  /** Close the active tool modal without changing armed flags. */
  const collapsePanel = useCallback(() => {
    closeAllPanels();
  }, [closeAllPanels]);

  return {
    activePanel, // Now represents the tool shown in modal (no more right sidebar)
    openPanel,
    togglePanel,
    collapsePanel,
    closeAllPanels,
  };
}