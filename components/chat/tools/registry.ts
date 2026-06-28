import type { Tool, ToolId } from "./types";
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
  research: {
    id: "research",
    label: "Research",
    enabled: false,
  },
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