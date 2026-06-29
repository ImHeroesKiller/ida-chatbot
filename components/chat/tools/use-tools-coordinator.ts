"use client";

import { useMemo } from "react";

import type { ToolsCoordinator } from "@/components/chat/tools/coordinator-types";
import { resolveSendFlags } from "@/components/chat/tools/tool-coordinator-config";
import { useToolPanelCoordinator } from "@/components/chat/tools/use-tool-panel-coordinator";
import { useToolPersistence } from "@/components/chat/tools/use-tool-persistence";
import { useToolRuntime } from "@/components/chat/tools/use-tool-runtime";
import { useToolUiActions } from "@/components/chat/tools/use-tool-ui-actions";
import type { IdaMessage } from "@/lib/types";

export type {
  StreamToolCoordinator,
  ToolAvailabilityFlags,
  ToolPanelCoordinator,
  ToolPanelHandlerCoordinator,
  ToolPersistPatch,
  ToolPersistenceCoordinator,
  ToolRailItem,
  ToolSendCoordinator,
  ToolSendFlags,
  ToolSessionCoordinator,
  ToolUiCoordinator,
  ToolsCoordinator,
} from "@/components/chat/tools/coordinator-types";

export interface ToolsCoordinatorOptions {
  webSearchAvailable: boolean;
  researchAvailable: boolean;
}

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
  const ui = useToolUiActions({
    entries,
    ctx,
    activePanel: panels.activePanel,
    openPanel: panels.openPanel,
    togglePanel: panels.togglePanel,
  });

  const sendFlags = useMemo(() => resolveSendFlags(bundle, ctx), [bundle, ctx]);

  return {
    worksheet: bundle.worksheet,
    webSearch: bundle.webSearch,
    research: bundle.research,
    map: bundle.map,
    activePanel: panels.activePanel,
    isAnyToolActive: ui.isAnyToolActive,
    ...sendFlags,
    openPanel: panels.openPanel,
    togglePanel: panels.togglePanel,
    collapsePanel: panels.collapsePanel,
    setWorksheetEnabled: ui.setWorksheetEnabled,
    setWebSearchEnabled: ui.setWebSearchEnabled,
    setResearchEnabled: ui.setResearchEnabled,
    setMapEnabled: ui.setMapEnabled,
    activateWorksheet: ui.activateWorksheet,
    activateWebSearch: ui.activateWebSearch,
    activateResearch: ui.activateResearch,
    activateMap: ui.activateMap,
    hydrateFromChat: persistence.hydrateFromChat,
    resetForNewChat: persistence.resetForNewChat,
    getPersistPatch: persistence.getPersistPatch,
    isToolActive: ui.isToolActive,
    handleMenuToolClick: ui.handleMenuToolClick,
    handleRailClick: ui.handleRailClick,
    railItems: ui.railItems,
    webSearchAvailable,
    researchAvailable,
    isWorksheetAvailable: persistence.isWorksheetAvailable,
    isWebSearchAvailable: persistence.isWebSearchAvailable,
    isResearchAvailable: persistence.isResearchAvailable,
    isMapAvailable: persistence.isMapAvailable,
  };
}

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