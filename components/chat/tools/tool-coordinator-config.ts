import { resolveToolEnabled } from "@/components/chat/tools/base-tool-state";
import {
  buildResearchResultFromMessages,
  findLastWebSearchSources,
  isToolAvailable,
} from "@/components/chat/tools/coordinator-helpers";
import type { MapTool } from "@/components/chat/tools/map/use-map";
import type { MusicGenTool } from "@/components/chat/tools/music-gen/use-music-gen";
import type { ResearchTool } from "@/components/chat/tools/research/use-research";
import { TOOL_UI_CONFIG } from "@/components/chat/tools/tool-ui-config";
import type { ToolId } from "@/components/chat/tools/types";
import type { VideoGenTool } from "@/components/chat/tools/video-gen/use-video-gen";
import type { WebSearchTool } from "@/components/chat/tools/web-search/use-web-search";
import type { WorkflowTool } from "@/components/chat/tools/use-workflow";
import type { WorksheetTool } from "@/components/chat/tools/worksheet/use-worksheet";
import type { ImageGenTool } from "@/components/chat/tools/image-gen/use-image-gen";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";

export const COORDINATOR_TOOL_ORDER: ToolId[] = [
  "worksheet",
  "workflow",
  "web-search",
  "research",
  "map",
  "image-gen",
  "video-gen",
  "music-gen",
];

export interface ToolRuntimeContext {
  webSearchAvailable: boolean;
  researchAvailable: boolean;
}

export interface ToolRuntimeBundle {
  worksheet: WorksheetTool;
  workflow: WorkflowTool;
  webSearch: WebSearchTool;
  research: ResearchTool;
  map: MapTool;
  imageGen: ImageGenTool;
  videoGen: VideoGenTool;
  musicGen: MusicGenTool;
}

export interface ToolRuntimeEntry {
  id: ToolId;
  tool: WorksheetTool | WorkflowTool | WebSearchTool | ResearchTool | MapTool | ImageGenTool | VideoGenTool | MusicGenTool;
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
      id: "workflow",
      tool: bundle.workflow,
      isAvailable: () => isToolAvailable("workflow"),
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
    {
      id: "image-gen",
      tool: bundle.imageGen,
      isAvailable: () => isToolAvailable("image-gen"),
    },
    {
      id: "video-gen",
      tool: bundle.videoGen,
      isAvailable: () => isToolAvailable("video-gen"),
    },
    {
      id: "music-gen",
      tool: bundle.musicGen,
      isAvailable: () => isToolAvailable("music-gen"),
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

    case "workflow":
      (tool as WorkflowTool).hydrate({
        enabled: resolveToolEnabled(
          chat.workflowToolEnabled,
          activePanel,
          panelId,
          isToolAvailable("workflow"),
        ),
        panelOpen,
        workspace: chat.workflow,
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

    case "image-gen":
    case "video-gen":
    case "music-gen":
      // Media gen tools — base hydrate only for now. Extend ChatSession with *Enabled flags + migration when persistence needed.
      (tool as any).hydrate?.({
        enabled: resolveToolEnabled(
          false,
          activePanel,
          panelId,
          isToolAvailable(id as ToolId),
        ),
        panelOpen,
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
    case "workflow":
      return { workflowToolEnabled: tool.isEnabled };
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
    case "image-gen":
    case "video-gen":
    case "music-gen":
      // TODO: persist enabled + results when ChatSession schema extended
      return { [`${id.replace(/-/g, "")}Enabled`]: tool.isEnabled } as any;
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
    workflowAtSend:
      isToolAvailable("workflow") && bundle.workflow.isEnabled,
  };
}