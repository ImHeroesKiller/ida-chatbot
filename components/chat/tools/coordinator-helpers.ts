import {
  isToolRailPlaceholder,
  TOOL_RAIL_GROUPS,
  type ToolRailEntryId,
} from "@/components/chat/tool-rail-config";
import { getTool } from "@/components/chat/tools/registry";
import type { ResearchResult } from "@/components/chat/tools/research/use-research";
import type { ToolId } from "@/components/chat/tools/types";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { IdaMessage } from "@/lib/types";

import type { ToolRailGroup, ToolRailItem } from "./coordinator-types";

export function isToolAvailable(id: ToolId): boolean {
  return getTool(id)?.enabled ?? false;
}

export function findLastWebSearchSources(
  messages: IdaMessage[],
): IdaMessage["webSearchSources"] | undefined {
  return [...messages]
    .reverse()
    .find((message) => message.webSearchSources?.length)?.webSearchSources;
}

export function buildResearchResultFromMessages(
  messages: IdaMessage[],
): ResearchResult | null {
  const lastResearchMessage = [...messages]
    .reverse()
    .find(
      (message) =>
        message.researchSources?.length || message.researchSummary,
    );

  if (!lastResearchMessage?.researchSources?.length) return null;

  const topic =
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content?.trim() ?? "Research";

  return {
    topic,
    depth: "standard",
    summary: lastResearchMessage.researchSummary ?? "",
    sources: lastResearchMessage.researchSources ?? [],
    queries: lastResearchMessage.researchQueries ?? [],
  };
}

export interface PanelController {
  panelId: RightSidebarPanel;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

export function resolveActivePanel(
  tools: PanelController[],
): RightSidebarPanel | null {
  return tools.find((tool) => tool.isPanelOpen)?.panelId ?? null;
}

export function closeAllPanelControllers(tools: PanelController[]): void {
  for (const tool of tools) {
    tool.closePanel();
  }
}

export function openExclusivePanel(
  tools: PanelController[],
  panel: RightSidebarPanel,
): void {
  closeAllPanelControllers(tools);
  const target = tools.find((tool) => tool.panelId === panel);
  target?.openPanel();
}

interface RailToolState {
  isEnabled: boolean;
  isAvailable: boolean;
}

function buildRailEntry(
  id: ToolRailEntryId,
  options: {
    activePanel: RightSidebarPanel | null;
    toolStates: Record<ToolId, RailToolState | undefined>;
    entry: (typeof TOOL_RAIL_GROUPS)[number]["entries"][number];
  },
): ToolRailItem | null {
  if (options.entry.comingSoon || isToolRailPlaceholder(id)) {
    return {
      id,
      labelKey: options.entry.labelKey,
      icon: options.entry.icon,
      isEnabled: false,
      isExpanded: false,
      isArmed: false,
      isDisabled: false,
      comingSoon: true,
    };
  }

  const toolId = id as ToolId;
  if (!isToolAvailable(toolId) || !options.entry.panel) return null;

  const panel = options.entry.panel;
  const state = options.toolStates[toolId];
  const isEnabled = state?.isEnabled ?? false;
  const isExpanded = options.activePanel === panel;
  const isAvailable = state?.isAvailable ?? true;
  const togglePanels: ToolId[] = [
    "web-search",
    "research",
    "worksheet",
    "workflow",
    "map",
  ];

  return {
    id: toolId,
    panel,
    labelKey: options.entry.labelKey,
    icon: options.entry.icon,
    isEnabled,
    isExpanded,
    isArmed:
      togglePanels.includes(toolId) && isEnabled && !isExpanded && isAvailable,
    isDisabled: !isAvailable,
  };
}

export function buildRailGroups(options: {
  activePanel: RightSidebarPanel | null;
  toolStates: Record<ToolId, RailToolState | undefined>;
}): ToolRailGroup[] {
  return TOOL_RAIL_GROUPS.map((group) => ({
    id: group.id,
    labelKey: group.labelKey,
    items: group.entries
      .map((entry) =>
        buildRailEntry(entry.id, {
          activePanel: options.activePanel,
          toolStates: options.toolStates,
          entry,
        }),
      )
      .filter((item): item is ToolRailItem => item !== null),
  })).filter((group) => group.items.length > 0);
}

export function extractPersistedPanel(chat: ChatSession): RightSidebarPanel | null {
  return chat.activeRightPanel ?? null;
}