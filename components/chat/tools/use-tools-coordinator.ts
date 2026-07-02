"use client";

import { useCallback, useEffect, useMemo } from "react";

import type { ToolsCoordinator } from "@/components/chat/tools/coordinator-types";
import { resolveSendFlags } from "@/components/chat/tools/tool-coordinator-config";
import type { ToolRuntimeEntry } from "@/components/chat/tools/tool-coordinator-config";
import { useToolPanelCoordinator } from "@/components/chat/tools/use-tool-panel-coordinator";
import { useToolPersistence } from "@/components/chat/tools/use-tool-persistence";
import { useToolRuntime } from "@/components/chat/tools/use-tool-runtime";
import { useToolUiActions } from "@/components/chat/tools/use-tool-ui-actions";
import { notifyHeavyToolsDesktopOnly } from "@/components/chat/tool-rail-notify";
import type { ToolId } from "@/components/chat/tools/types";
import { isHeavyToolPanel } from "@/lib/client/heavy-tools-desktop";
import type { Locale } from "@/lib/config";
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
  locale: Locale;
  heavyToolsDesktop: boolean;
  desktopSidebar: boolean;
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
  const {
    webSearchAvailable,
    researchAvailable,
    locale,
    heavyToolsDesktop,
    desktopSidebar,
  } = options;

  const ctx = useMemo(
    () => ({
      webSearchAvailable,
      researchAvailable,
      heavyToolsDesktop,
      desktopSidebar,
    }),
    [desktopSidebar, heavyToolsDesktop, researchAvailable, webSearchAvailable],
  );

  const blockHeavyToolPanel = useCallback(
    (panel: RightSidebarPanel): boolean => {
      if (heavyToolsDesktop || !isHeavyToolPanel(panel)) return false;
      notifyHeavyToolsDesktopOnly(locale);
      return true;
    },
    [heavyToolsDesktop, locale],
  );

  const { bundle, entries } = useToolRuntime();

  const panels = useToolPanelCoordinator(entries);
  const persistence = useToolPersistence({
    entries,
    activePanel: panels.activePanel,
    heavyToolsDesktop,
    desktopSidebar,
  });

  useEffect(() => {
    if (!desktopSidebar && panels.activePanel) {
      panels.closeAllPanels();
    }
  }, [desktopSidebar, panels.activePanel, panels.closeAllPanels]);

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
      if (blockHeavyToolPanel(panel)) return;
      if (!desktopSidebar) return;
      panels.openPanel(panel);
    },
    [blockHeavyToolPanel, desktopSidebar, panels],
  );

  /**
   * Toggle panel visibility with mutual exclusion.
   * Active panel closes; otherwise the target opens exclusively.
   */
  const togglePanel = useCallback(
    (panel: RightSidebarPanel) => {
      if (blockHeavyToolPanel(panel)) return;
      if (!desktopSidebar) return;
      panels.togglePanel(panel);
    },
    [blockHeavyToolPanel, desktopSidebar, panels],
  );

  const ui = useToolUiActions({
    entries,
    ctx,
    locale,
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
      if (!entry) return;
      if (!entry.isAvailable(ctx)) {
        if (
          !heavyToolsDesktop &&
          (toolId === "worksheet" || toolId === "workflow")
        ) {
          notifyHeavyToolsDesktopOnly(locale);
        }
        return;
      }

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
    [closeAllPanels, ctx, entries, heavyToolsDesktop, locale, openPanel, panels.activePanel],
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
   * Research toggle — arms/disarms without disabling sibling tools.
   */
  const toggleResearchTool = useCallback(
    (openPanelOnEnable = true) => {
      if (!ctx.researchAvailable) return;

      const { research } = bundle;
      const isActive =
        research.isEnabled || panels.activePanel === research.panelId;
      const next = !isActive;

      research.setEnabled(next);

      if (next && openPanelOnEnable) {
        openPanel(research.panelId);
      } else if (!next && panels.activePanel === research.panelId) {
        research.closePanel();
      }
    },
    [bundle, ctx.researchAvailable, openPanel, panels.activePanel],
  );

  /**
   * Map toggle — arms/disarms without disabling sibling tools.
   */
  const toggleMapTool = useCallback(
    (openPanelOnEnable = true) => {
      const { map } = bundle;
      const isActive = map.isEnabled || panels.activePanel === map.panelId;
      const next = !isActive;

      map.setEnabled(next);

      if (next && openPanelOnEnable) {
        openPanel(map.panelId);
      } else if (!next && panels.activePanel === map.panelId) {
        map.closePanel();
      }
    },
    [bundle, openPanel, panels.activePanel],
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
    workflow: bundle.workflow,
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
    toggleResearchTool,
    toggleMapTool,
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
    isWorkflowAvailable: persistence.isWorkflowAvailable,
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