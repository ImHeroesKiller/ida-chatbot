"use client";

import { useCallback, useMemo } from "react";

import { buildRailItems } from "@/components/chat/tools/coordinator-helpers";
import type { ToolRailItem } from "@/components/chat/tools/coordinator-types";
import {
  getToolMenuKind,
  type ToolRuntimeContext,
  type ToolRuntimeEntry,
} from "@/components/chat/tools/tool-coordinator-config";
import { TOOL_UI_CONFIG } from "@/components/chat/tools/tool-ui-config";
import type { ToolId } from "@/components/chat/tools/types";
import type { RightSidebarPanel } from "@/lib/chat-tools";

type ToggleSetter = (enabled: boolean) => void;

function createToggleSetter(options: {
  isAvailable: () => boolean;
  setEnabled: (enabled: boolean) => void;
  panelId: RightSidebarPanel;
  activePanel: RightSidebarPanel | null;
  openPanel: (panel: RightSidebarPanel) => void;
  closePanel: () => void;
}): ToggleSetter {
  return (enabled: boolean) => {
    if (!options.isAvailable()) return;
    options.setEnabled(enabled);
    if (enabled) {
      options.openPanel(options.panelId);
    } else if (options.activePanel === options.panelId) {
      options.closePanel();
    }
  };
}

interface UseToolUiActionsOptions {
  entries: ToolRuntimeEntry[];
  ctx: ToolRuntimeContext;
  activePanel: RightSidebarPanel | null;
  openPanel: (panel: RightSidebarPanel) => void;
  togglePanel: (panel: RightSidebarPanel) => void;
}

export function useToolUiActions({
  entries,
  ctx,
  activePanel,
  openPanel,
  togglePanel,
}: UseToolUiActionsOptions) {
  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  );

  const toggleSetters = useMemo(() => {
    const map = new Map<ToolId, ToggleSetter>();

    for (const entry of entries) {
      map.set(
        entry.id,
        createToggleSetter({
          isAvailable: () => entry.isAvailable(ctx),
          setEnabled: entry.tool.setEnabled,
          panelId: entry.tool.panelId,
          activePanel,
          openPanel,
          closePanel: entry.tool.closePanel,
        }),
      );
    }

    return map;
  }, [activePanel, ctx, entries, openPanel]);

  const setWorksheetEnabled = toggleSetters.get("worksheet")!;
  const setWebSearchEnabled = toggleSetters.get("web-search")!;
  const setResearchEnabled = toggleSetters.get("research")!;
  const setMapEnabled = toggleSetters.get("map")!;

  const activateTool = useCallback(
    (toolId: ToolId) => {
      const entry = entryById.get(toolId);
      if (!entry?.isAvailable(ctx)) return;
      entry.tool.setEnabled(true);
      openPanel(entry.tool.panelId);
    },
    [ctx, entryById, openPanel],
  );

  const activateWorksheet = useCallback(
    () => activateTool("worksheet"),
    [activateTool],
  );
  const activateWebSearch = useCallback(
    () => activateTool("web-search"),
    [activateTool],
  );
  const activateResearch = useCallback(
    () => activateTool("research"),
    [activateTool],
  );
  const activateMap = useCallback(() => activateTool("map"), [activateTool]);

  const isToolActive = useCallback(
    (toolId: ToolId): boolean => {
      const entry = entryById.get(toolId);
      if (!entry) return false;
      return entry.tool.isEnabled || activePanel === entry.tool.panelId;
    },
    [activePanel, entryById],
  );

  const handleMenuToolClick = useCallback(
    (toolId: ToolId) => {
      const entry = entryById.get(toolId);
      const toggleSetter = toggleSetters.get(toolId);
      if (!entry || !toggleSetter) return;

      const config = TOOL_UI_CONFIG[toolId];
      const kind = getToolMenuKind(toolId);

      if (kind.startsWith("toggle-")) {
        toggleSetter(!entry.tool.isEnabled);
        return;
      }

      if (kind === "open-panel" && config.panel) {
        if (toolId === "map") {
          toggleSetter(true);
        }
        openPanel(config.panel);
      }
    },
    [entryById, openPanel, toggleSetters],
  );

  const handleRailClick = useCallback(
    (toolId: ToolId, panel: RightSidebarPanel) => {
      const entry = entryById.get(toolId);
      const toggleSetter = toggleSetters.get(toolId);
      if (!entry || !toggleSetter) return;
      if (!entry.isAvailable(ctx)) return;

      if (!entry.tool.isEnabled) {
        toggleSetter(true);
      }

      togglePanel(panel);
    },
    [ctx, entryById, togglePanel, toggleSetters],
  );

  const enabledFlags = entries.map((entry) => entry.tool.isEnabled);

  const railItems = useMemo(
    (): ToolRailItem[] =>
      buildRailItems({
        activePanel,
        toolStates: Object.fromEntries(
          entries.map((entry) => [
            entry.id,
            {
              isEnabled: entry.tool.isEnabled,
              isAvailable: entry.isAvailable(ctx),
            },
          ]),
        ) as Parameters<typeof buildRailItems>[0]["toolStates"],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePanel, ctx.webSearchAvailable, ctx.researchAvailable, ...enabledFlags],
  );

  const isAnyToolActive = useMemo(
    () =>
      entries.some((entry) => entry.tool.isEnabled) || activePanel !== null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePanel, ...enabledFlags],
  );

  return {
    setWorksheetEnabled,
    setWebSearchEnabled,
    setResearchEnabled,
    setMapEnabled,
    activateWorksheet,
    activateWebSearch,
    activateResearch,
    activateMap,
    isToolActive,
    handleMenuToolClick,
    handleRailClick,
    railItems,
    isAnyToolActive,
  };
}