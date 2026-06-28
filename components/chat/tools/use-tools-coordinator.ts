"use client";

import { useCallback, useMemo, useState } from "react";

import { getTool } from "@/components/chat/tools/registry";
import { useResearch } from "@/components/chat/tools/research/use-research";
import type { ResearchResult } from "@/components/chat/tools/research/use-research";
import { TOOL_UI_CONFIG } from "@/components/chat/tools/tool-ui-config";

import { useWebSearch } from "@/components/chat/tools/web-search/use-web-search";
import { useWorksheet } from "@/components/chat/tools/worksheet/use-worksheet";
import { resolveToolEnabled } from "@/components/chat/tools/base-tool-state";
import type { ToolId } from "@/components/chat/tools/types";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { IdaMessage } from "@/lib/types";

export interface ToolRailItem {
  id: ToolId;
  panel: RightSidebarPanel;
  labelKey: (typeof TOOL_UI_CONFIG)[ToolId]["labelKey"];
  icon: (typeof TOOL_UI_CONFIG)[ToolId]["icon"];
  isEnabled: boolean;
  isExpanded: boolean;
  isArmed: boolean;
  isDisabled: boolean;
}

export interface ToolsCoordinatorOptions {
  webSearchAvailable: boolean;
  researchAvailable: boolean;
}

function isWorksheetToolAvailable(): boolean {
  return getTool("worksheet")?.enabled ?? false;
}

function isWebSearchToolAvailable(): boolean {
  return getTool("web-search")?.enabled ?? false;
}

function isResearchToolAvailable(): boolean {
  return getTool("research")?.enabled ?? false;
}

export function useToolsCoordinator(options: ToolsCoordinatorOptions) {
  const { webSearchAvailable, researchAvailable } = options;

  const worksheet = useWorksheet();
  const webSearch = useWebSearch();
  const research = useResearch();
  const [mapPanelOpen, setMapPanelOpen] = useState(false);

  const activePanel = useMemo((): RightSidebarPanel | null => {
    if (worksheet.isPanelOpen) return worksheet.panelId;
    if (webSearch.isPanelOpen) return webSearch.panelId;
    if (research.isPanelOpen) return research.panelId;
    if (mapPanelOpen) return "map";
    return null;
  }, [
    mapPanelOpen,
    research.isPanelOpen,
    research.panelId,
    webSearch.isPanelOpen,
    webSearch.panelId,
    worksheet.isPanelOpen,
    worksheet.panelId,
  ]);

  const closeAllPanels = useCallback(() => {
    worksheet.closePanel();
    webSearch.closePanel();
    research.closePanel();
    setMapPanelOpen(false);
  }, [research, webSearch, worksheet]);

  const openPanel = useCallback(
    (panel: RightSidebarPanel) => {
      closeAllPanels();

      switch (panel) {
        case "worksheet":
          worksheet.openPanel();
          break;
        case "web-search":
          webSearch.openPanel();
          break;
        case "research":
          research.openPanel();
          break;
        case "map":
          setMapPanelOpen(true);
          break;
      }
    },
    [closeAllPanels, research, webSearch, worksheet],
  );

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

  const collapsePanel = useCallback(() => {
    closeAllPanels();
  }, [closeAllPanels]);

  const setWorksheetEnabled = useCallback(
    (enabled: boolean) => {
      if (!isWorksheetToolAvailable()) return;
      worksheet.setEnabled(enabled);
      if (enabled) {
        openPanel("worksheet");
      } else if (activePanel === "worksheet") {
        worksheet.closePanel();
      }
    },
    [activePanel, openPanel, worksheet],
  );

  const setWebSearchEnabled = useCallback(
    (enabled: boolean) => {
      if (!isWebSearchToolAvailable() || !webSearchAvailable) return;
      webSearch.setEnabled(enabled);
      if (enabled) {
        openPanel("web-search");
      } else if (activePanel === "web-search") {
        webSearch.closePanel();
      }
    },
    [activePanel, openPanel, webSearch, webSearchAvailable],
  );

  const setResearchEnabled = useCallback(
    (enabled: boolean) => {
      if (!isResearchToolAvailable() || !researchAvailable) return;
      research.setEnabled(enabled);
      if (enabled) {
        openPanel("research");
      } else if (activePanel === "research") {
        research.closePanel();
      }
    },
    [activePanel, openPanel, research, researchAvailable],
  );

  const activateWorksheet = useCallback(() => {
    if (!isWorksheetToolAvailable()) return;
    worksheet.setEnabled(true);
    openPanel("worksheet");
  }, [openPanel, worksheet]);

  const activateWebSearch = useCallback(() => {
    if (!isWebSearchToolAvailable() || !webSearchAvailable) return;
    webSearch.setEnabled(true);
    openPanel("web-search");
  }, [openPanel, webSearch, webSearchAvailable]);

  const activateResearch = useCallback(() => {
    if (!isResearchToolAvailable() || !researchAvailable) return;
    research.setEnabled(true);
    openPanel("research");
  }, [openPanel, research, researchAvailable]);

  const hydrateFromChat = useCallback(
    (chat: ChatSession) => {
      const panel = chat.activeRightPanel ?? null;

      worksheet.hydrate({
        enabled: resolveToolEnabled(
          chat.worksheetToolEnabled,
          panel,
          worksheet.panelId,
          isWorksheetToolAvailable(),
        ),
        panelOpen: panel === worksheet.panelId,
      });

      const lastWebSearchMessage = [...chat.messages]
        .reverse()
        .find((message) => message.webSearchSources?.length);

      webSearch.hydrate({
        enabled: resolveToolEnabled(
          chat.webSearchEnabled,
          panel,
          webSearch.panelId,
          isWebSearchToolAvailable(),
        ),
        panelOpen: panel === webSearch.panelId,
        results: lastWebSearchMessage?.webSearchSources,
      });

      const lastResearchMessage = [...chat.messages]
        .reverse()
        .find(
          (message) =>
            message.researchSources?.length || message.researchSummary,
        );

      const lastResearchResult: ResearchResult | null = lastResearchMessage
        ?.researchSources?.length
        ? {
            topic:
              [...chat.messages]
                .reverse()
                .find((message) => message.role === "user")
                ?.content?.trim() ?? "Research",
            depth: "standard",
            summary: lastResearchMessage.researchSummary ?? "",
            sources: lastResearchMessage.researchSources ?? [],
            queries: lastResearchMessage.researchQueries ?? [],
          }
        : null;

      research.hydrate({
        enabled: resolveToolEnabled(
          chat.researchEnabled,
          panel,
          research.panelId,
          isResearchToolAvailable(),
        ),
        panelOpen: panel === research.panelId,
        sessions: chat.researchSessions ?? [],
        lastResult: lastResearchResult,
      });

      setMapPanelOpen(panel === "map");
    },
    [research, webSearch, worksheet],
  );

  const resetForNewChat = useCallback(() => {
    worksheet.resetForNewChat();
    webSearch.resetForNewChat();
    research.resetForNewChat();
    setMapPanelOpen(false);
  }, [research, webSearch, worksheet]);

  const getPersistPatch = useCallback(
    () => ({
      activeRightPanel: activePanel,
      worksheetToolEnabled: worksheet.isEnabled,
      webSearchEnabled: webSearch.isEnabled,
      researchEnabled: research.isEnabled,
      researchSessions: research.researchSessions,
    }),
    [
      activePanel,
      research.isEnabled,
      research.researchSessions,
      webSearch.isEnabled,
      worksheet.isEnabled,
    ],
  );

  const isToolActive = useCallback(
    (toolId: ToolId): boolean => {
      switch (toolId) {
        case "worksheet":
          return worksheet.isEnabled || activePanel === "worksheet";
        case "web-search":
          return webSearch.isEnabled || activePanel === "web-search";
        case "research":
          return research.isEnabled || activePanel === "research";
        case "map":
          return activePanel === "map";
        default:
          return false;
      }
    },
    [
      activePanel,
      research.isEnabled,
      webSearch.isEnabled,
      worksheet.isEnabled,
    ],
  );

  const handleMenuToolClick = useCallback(
    (toolId: ToolId) => {
      const config = TOOL_UI_CONFIG[toolId];

      switch (config.kind) {
        case "toggle-web-search":
          if (!webSearchAvailable) return;
          if (!webSearch.isEnabled) {
            setWebSearchEnabled(true);
          } else {
            setWebSearchEnabled(false);
          }
          break;
        case "toggle-research":
          if (!researchAvailable) return;
          if (!research.isEnabled) {
            setResearchEnabled(true);
          } else {
            setResearchEnabled(false);
          }
          break;
        case "toggle-worksheet":
          setWorksheetEnabled(!worksheet.isEnabled);
          break;
        case "open-panel":
          if (config.panel) {
            openPanel(config.panel);
          }
          break;
      }
    },
    [
      openPanel,
      research.isEnabled,
      researchAvailable,
      setResearchEnabled,
      setWebSearchEnabled,
      setWorksheetEnabled,
      webSearch.isEnabled,
      webSearchAvailable,
      worksheet.isEnabled,
    ],
  );

  const handleRailClick = useCallback(
    (toolId: ToolId, panel: RightSidebarPanel) => {
      if (toolId === "web-search") {
        if (!webSearchAvailable) return;
        if (!webSearch.isEnabled) {
          setWebSearchEnabled(true);
        }
        togglePanel(panel);
        return;
      }

      if (toolId === "research") {
        if (!researchAvailable) return;
        if (!research.isEnabled) {
          setResearchEnabled(true);
        }
        togglePanel(panel);
        return;
      }

      togglePanel(panel);
    },
    [
      research.isEnabled,
      researchAvailable,
      setResearchEnabled,
      setWebSearchEnabled,
      togglePanel,
      webSearch.isEnabled,
      webSearchAvailable,
    ],
  );

  const railItems = useMemo((): ToolRailItem[] => {
    const togglePanels: ToolId[] = ["web-search", "research", "worksheet"];

    return (["web-search", "map", "research", "worksheet"] as ToolId[])
      .filter((id) => {
        const config = TOOL_UI_CONFIG[id];
        return getTool(id)?.enabled && config.railPanel;
      })
      .map((id) => {
        const config = TOOL_UI_CONFIG[id];
        const panel = config.railPanel!;
        const isEnabled =
          id === "worksheet"
            ? worksheet.isEnabled
            : id === "web-search"
              ? webSearch.isEnabled
              : id === "research"
                ? research.isEnabled
                : false;
        const isExpanded = activePanel === panel;
        const isArmed =
          togglePanels.includes(id) &&
          isEnabled &&
          !isExpanded &&
          (id === "web-search"
            ? webSearchAvailable
            : id === "research"
              ? researchAvailable
              : true);
        const isDisabled =
          (id === "web-search" && !webSearchAvailable) ||
          (id === "research" && !researchAvailable);

        return {
          id,
          panel,
          labelKey: config.labelKey,
          icon: config.icon,
          isEnabled,
          isExpanded,
          isArmed,
          isDisabled,
        };
      });
  }, [
    activePanel,
    research.isEnabled,
    researchAvailable,
    webSearch.isEnabled,
    webSearchAvailable,
    worksheet.isEnabled,
  ]);

  const isAnyToolActive = useMemo(
    () =>
      worksheet.isEnabled ||
      webSearch.isEnabled ||
      research.isEnabled ||
      activePanel !== null,
    [
      activePanel,
      research.isEnabled,
      webSearch.isEnabled,
      worksheet.isEnabled,
    ],
  );

  const worksheetAtSend =
    isWorksheetToolAvailable() && worksheet.isEnabled;
  const webSearchAtSend =
    isWebSearchToolAvailable() &&
    webSearchAvailable &&
    webSearch.isEnabled &&
    !research.isEnabled;
  const researchAtSend =
    isResearchToolAvailable() &&
    researchAvailable &&
    research.isEnabled;

  return {
    worksheet,
    webSearch,
    research,
    activePanel,
    isAnyToolActive,
    worksheetAtSend,
    webSearchAtSend,
    researchAtSend,
    openPanel,
    togglePanel,
    collapsePanel,
    setWorksheetEnabled,
    setWebSearchEnabled,
    setResearchEnabled,
    activateWorksheet,
    activateWebSearch,
    activateResearch,
    hydrateFromChat,
    resetForNewChat,
    getPersistPatch,
    isToolActive,
    handleMenuToolClick,
    handleRailClick,
    railItems,
    webSearchAvailable,
    researchAvailable,
    isWorksheetAvailable: isWorksheetToolAvailable(),
    isWebSearchAvailable: isWebSearchToolAvailable(),
    isResearchAvailable: isResearchToolAvailable(),
  };
}

export type ToolsCoordinator = ReturnType<typeof useToolsCoordinator>;

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