import { resolveToolEnabled } from "@/components/chat/tools/base-tool-state";
import {
  buildResearchResultFromMessages,
  findLastWebSearchSources,
  isToolAvailable,
} from "@/components/chat/tools/coordinator-helpers";
import type { MapTool } from "@/components/chat/tools/map/use-map";
import type { ResearchTool } from "@/components/chat/tools/research/use-research";
import { TOOL_UI_CONFIG } from "@/components/chat/tools/tool-ui-config";
import type { ToolId } from "@/components/chat/tools/types";
import type { WebSearchTool } from "@/components/chat/tools/web-search/use-web-search";
import type { WorksheetTool } from "@/components/chat/tools/worksheet/use-worksheet";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";

export const COORDINATOR_TOOL_ORDER: ToolId[] = [
  "worksheet",
  "web-search",
  "research",
  "map",
];

export interface ToolRuntimeContext {
  webSearchAvailable: boolean;
  researchAvailable: boolean;
}

export interface ToolRuntimeBundle {
  worksheet: WorksheetTool;
  webSearch: WebSearchTool;
  research: ResearchTool;
  map: MapTool;
}

export interface ToolRuntimeEntry {
  id: ToolId;
  tool: WorksheetTool | WebSearchTool | ResearchTool | MapTool;
  isAvailable: (ctx: ToolRuntimeContext) => boolean;
}

export function buildToolRuntime(
  bundle: ToolRuntimeBundle,
): ToolRuntimeEntry[] {
  return [
    {
      id: "worksheet",
      tool: bundle.worksheet,
      isAvailable: () => isToolAvailable("worksheet"),
    },
    {
      id: "web-search",
      tool: bundle.webSearch,
      isAvailable: (ctx) =>
        isToolAvailable("web-search") && ctx.webSearchAvailable,
    },
    {
      id: "research",
      tool: bundle.research,
      isAvailable: (ctx) =>
        isToolAvailable("research") && ctx.researchAvailable,
    },
    {
      id: "map",
      tool: bundle.map,
      isAvailable: () => isToolAvailable("map"),
    },
  ];
}

export function hydrateToolFromChat(
  entry: ToolRuntimeEntry,
  chat: ChatSession,
  activePanel: RightSidebarPanel | null,
): void {
  const { id, tool } = entry;
  const panelId = tool.panelId;
  const panelOpen = activePanel === panelId;

  switch (id) {
    case "worksheet":
      (tool as WorksheetTool).hydrate({
        enabled: resolveToolEnabled(
          chat.worksheetToolEnabled,
          activePanel,
          panelId,
          isToolAvailable("worksheet"),
        ),
        panelOpen,
        workspace: chat.worksheet,
      });
      break;

    case "web-search":
      (tool as WebSearchTool).hydrate({
        enabled: resolveToolEnabled(
          chat.webSearchEnabled,
          activePanel,
          panelId,
          isToolAvailable("web-search"),
        ),
        panelOpen,
        results: findLastWebSearchSources(chat.messages),
      });
      break;

    case "research":
      (tool as ResearchTool).hydrate({
        enabled: resolveToolEnabled(
          chat.researchEnabled,
          activePanel,
          panelId,
          isToolAvailable("research"),
        ),
        panelOpen,
        sessions: chat.researchSessions ?? [],
        lastResult: buildResearchResultFromMessages(chat.messages),
      });
      break;

    case "map":
      (tool as MapTool).hydrate({
        enabled: resolveToolEnabled(
          chat.mapEnabled,
          activePanel,
          panelId,
          isToolAvailable("map"),
        ),
        panelOpen,
        viewState: chat.mapViewState,
      });
      break;
  }
}

export function getToolPersistFields(
  entry: ToolRuntimeEntry,
): Partial<ChatSession> {
  const { id, tool } = entry;

  switch (id) {
    case "worksheet":
      return { worksheetToolEnabled: tool.isEnabled };
    case "web-search":
      return { webSearchEnabled: tool.isEnabled };
    case "research":
      return {
        researchEnabled: tool.isEnabled,
        researchSessions: (tool as ResearchTool).researchSessions,
      };
    case "map":
      return {
        mapEnabled: tool.isEnabled,
        mapViewState: (tool as MapTool).viewState,
      };
    default:
      return {};
  }
}

export function getToolMenuKind(toolId: ToolId) {
  return TOOL_UI_CONFIG[toolId].kind;
}

export function resolveSendFlags(
  bundle: ToolRuntimeBundle,
  ctx: ToolRuntimeContext,
) {
  return {
    worksheetAtSend:
      isToolAvailable("worksheet") && bundle.worksheet.isEnabled,
    webSearchAtSend:
      isToolAvailable("web-search") &&
      ctx.webSearchAvailable &&
      bundle.webSearch.isEnabled &&
      !bundle.research.isEnabled,
    researchAtSend:
      isToolAvailable("research") &&
      ctx.researchAvailable &&
      bundle.research.isEnabled,
  };
}