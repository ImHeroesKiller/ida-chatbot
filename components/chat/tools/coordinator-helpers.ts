import { getTool } from "@/components/chat/tools/registry";
import type { ResearchResult } from "@/components/chat/tools/research/use-research";
import { TOOL_UI_CONFIG } from "@/components/chat/tools/tool-ui-config";
import type { ToolId } from "@/components/chat/tools/types";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { IdaMessage } from "@/lib/types";

import type { ToolRailItem } from "./coordinator-types";

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

export function buildRailItems(options: {
  activePanel: RightSidebarPanel | null;
  toolStates: Record<ToolId, RailToolState | undefined>;
}): ToolRailItem[] {
  const togglePanels: ToolId[] = ["web-search", "research", "worksheet", "map"];
  const order: ToolId[] = ["web-search", "map", "research", "worksheet"];

  return order
    .filter((id) => {
      const config = TOOL_UI_CONFIG[id];
      return isToolAvailable(id) && config.railPanel;
    })
    .map((id) => {
      const config = TOOL_UI_CONFIG[id];
      const panel = config.railPanel!;
      const state = options.toolStates[id];
      const isEnabled = state?.isEnabled ?? false;
      const isExpanded = options.activePanel === panel;
      const isAvailable = state?.isAvailable ?? true;

      return {
        id,
        panel,
        labelKey: config.labelKey,
        icon: config.icon,
        isEnabled,
        isExpanded,
        isArmed:
          togglePanels.includes(id) && isEnabled && !isExpanded && isAvailable,
        isDisabled: !isAvailable,
      };
    });
}

export function extractPersistedPanel(chat: ChatSession): RightSidebarPanel | null {
  return chat.activeRightPanel ?? null;
}