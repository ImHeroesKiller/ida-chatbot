import type { Tool, ToolId } from "./types";
import { researchTool } from "./research/research-tool";
import { webSearchTool } from "./web-search/web-search-tool";
import { worksheetTool } from "./worksheet/worksheet-tool";

const tools: Record<ToolId, Tool> = {
  worksheet: worksheetTool,
  "web-search": webSearchTool,
  map: {
    id: "map",
    label: "Map",
    enabled: false,
  },
  research: researchTool,
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