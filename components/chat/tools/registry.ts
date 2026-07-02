import type { Tool, ToolId } from "./types";
import { imageGenTool } from "./image-gen/image-gen-tool";
import { mapTool } from "./map/map-tool";
import { musicGenTool } from "./music-gen/music-gen-tool";
import { researchTool } from "./research/research-tool";
import { videoGenTool } from "./video-gen/video-gen-tool";
import { webSearchTool } from "./web-search/web-search-tool";
import { workflowTool } from "./workflow-tool";
import { worksheetTool } from "./worksheet/worksheet-tool";

/** Modular tool registry — runtime hooks are wired via `useToolRuntime`. */

const tools: Record<ToolId, Tool> = {
  worksheet: worksheetTool,
  workflow: workflowTool,
  "web-search": webSearchTool,
  map: mapTool,
  research: researchTool,
  "image-gen": imageGenTool,
  "video-gen": videoGenTool,
  "music-gen": musicGenTool,
};

export function getTool(id: ToolId): Tool | undefined {
  return tools[id];
}

export function getAllTools(): Tool[] {
  return Object.values(tools);
}

export function isToolEnabled(id: ToolId): boolean {
  return tools[id]?.enabled ?? false;
}