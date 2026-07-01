"use client";

import { useCallback, useMemo } from "react";

import type { ToolsCoordinator } from "@/components/chat/tools/coordinator-types";
import { resolveSendFlags } from "@/components/chat/tools/tool-coordinator-config";
import type { ToolRuntimeEntry } from "@/components/chat/tools/tool-coordinator-config";
import { useToolPanelCoordinator } from "@/components/chat/tools/use-tool-panel-coordinator";
import { useToolPersistence } from "@/components/chat/tools/use-tool-persistence";
import { useToolRuntime } from "@/components/chat/tools/use-tool-runtime";
import { useToolUiActions } from "@/components/chat/tools/use-tool-ui-actions";
import type { ToolId } from "@/components/chat/tools/types";
import type { IdaMessage } from "@/lib/types";
import type { RightSidebarPanel } from "@/lib/chat-tools";

export type {
  StreamToolCoordinator,
  ToolAvailabilityFlags,
  ToolPanelCoordinator,
  ToolPanelHandlerCoordinator,
  ToolPersistPatch,
  ToolPersistenceCoordinator,
  ToolRailGroup,
  ToolRailItem,
  ToolSendCoordinator,
  ToolSendFlags,
  ToolSessionCoordinator,
  ToolToggleCoordinator,
  ToolUiCoordinator,
  ToolsCoordinator,
} from "@/components/chat/tools/coordinator-types";

export interface ToolsCoordinatorOptions {
  webSearchAvailable: boolean;
  researchAvailable: boolean;
}

function findEntry(
  entries: ToolRuntimeEntry[],
  toolId: ToolId,
): ToolRuntimeEntry | undefined {
  return entries.find((entry) => entry.id === toolId);
}

/**
 * Central coordinator for all chat tools (worksheet, web-search, research, map).
 *
 * Composes panel exclusivity, UI actions, persistence, and send-time flags.
 * Consumers (e.g. `chat-room.tsx`) should interact only with this hook.
 */
export function useToolsCoordinator(
  options: ToolsCoordinatorOptions,
): ToolsCoordinator {
  const { webSearchAvailable, researchAvailable } = options;

  const ctx = useMemo(
    () => ({ webSearchAvailable, researchAvailable }),
    [researchAvailable, webSearchAvailable],
  );

  const { bundle, entries } = useToolRuntime();

  const panels = useToolPanelCoordinator(entries);
  const persistence = useToolPersistence({
    entries,
    activePanel: panels.activePanel,
  });

  /**
   * Close every sidebar panel. Does not change which tools are armed.
   */
  const closeAllPanels = useCallback(() => {
    panels.closeAllPanels();
  }, [panels]);

  /**
   * Open exactly one panel; all other tool panels are closed first.
   */
  const openPanel = useCallback(
    (panel: RightSidebarPanel) => {
      panels.openPanel(panel);
    },
    [panels],
  );

  /**
   * Toggle panel visibility with mutual exclusion.
   * Active panel closes; otherwise the target opens exclusively.
   */
  const togglePanel = useCallback(
    (panel: RightSidebarPanel) => {
      panels.togglePanel(panel);
    },
    [panels],
  );

  const ui = useToolUiActions({
    entries,
    ctx,
    activePanel: panels.activePanel,
    openPanel,
    togglePanel,
  });

  /**
   * Toggle one tool's armed state and panel together.
   * Other tools may stay armed; only sidebar panels are mutually exclusive.
   */
  const toggleTool = useCallback(
    (toolId: ToolId) => {
      const entry = findEntry(entries, toolId);
      if (!entry?.isAvailable(ctx)) return;

      const { tool } = entry;

      if (tool.isEnabled) {
        tool.setEnabled(false);
        if (panels.activePanel === tool.panelId) {
          closeAllPanels();
        }
        return;
      }

      tool.setEnabled(true);
      openPanel(tool.panelId);
    },
    [closeAllPanels, ctx, entries, openPanel, panels.activePanel],
  );

  /**
   * Internet toggle used by the mobile composer — preserves other armed tools.
   */
  const toggleWebSearchInternet = useCallback(
    (openPanelOnEnable = false) => {
      if (!ctx.webSearchAvailable) return;

      const { webSearch } = bundle;
      const isActive =
        webSearch.isEnabled || panels.activePanel === webSearch.panelId;
      const next = !isActive;

      webSearch.setEnabled(next);

      if (next && openPanelOnEnable) {
        openPanel(webSearch.panelId);
      } else if (!next && panels.activePanel === webSearch.panelId) {
        webSearch.closePanel();
      }
    },
    [bundle, ctx.webSearchAvailable, openPanel, panels.activePanel],
  );

  /**
   * Full reset for New Chat: close all panels, then clear every tool hook.
   */
  const resetAllTools = useCallback(() => {
    closeAllPanels();
    persistence.resetForNewChat();
  }, [closeAllPanels, persistence]);

  const sendFlags = useMemo(() => resolveSendFlags(bundle, ctx), [bundle, ctx]);

  return {
    worksheet: bundle.worksheet,
    webSearch: bundle.webSearch,
    research: bundle.research,
    map: bundle.map,
    activePanel: panels.activePanel,
    isAnyToolActive: ui.isAnyToolActive,
    ...sendFlags,
    openPanel,
    togglePanel,
    collapsePanel: panels.collapsePanel,
    closeAllPanels,
    toggleTool,
    toggleWebSearchInternet,
    setWorksheetEnabled: ui.setWorksheetEnabled,
    setWebSearchEnabled: ui.setWebSearchEnabled,
    setResearchEnabled: ui.setResearchEnabled,
    setMapEnabled: ui.setMapEnabled,
    activateWorksheet: ui.activateWorksheet,
    activateWebSearch: ui.activateWebSearch,
    activateResearch: ui.activateResearch,
    activateMap: ui.activateMap,
    hydrateFromChat: persistence.hydrateFromChat,
    resetAllTools,
    resetForNewChat: resetAllTools,
    getPersistPatch: persistence.getPersistPatch,
    isToolActive: ui.isToolActive,
    handleMenuToolClick: ui.handleMenuToolClick,
    handleRailClick: ui.handleRailClick,
    railGroups: ui.railGroups,
    webSearchAvailable,
    researchAvailable,
    isWorksheetAvailable: persistence.isWorksheetAvailable,
    isWebSearchAvailable: persistence.isWebSearchAvailable,
    isResearchAvailable: persistence.isResearchAvailable,
    isMapAvailable: persistence.isMapAvailable,
  };
}

/** Last user message content, used as the default research topic label. */
export function extractResearchTopicFromMessages(
  messages: IdaMessage[],
  fallback = "Research",
): string {
  return (
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content?.trim() ?? fallback
  );
}