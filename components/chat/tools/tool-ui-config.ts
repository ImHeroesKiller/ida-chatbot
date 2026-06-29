import { FileText, Globe, Map, Search, type LucideIcon } from "lucide-react";

import type { RightSidebarPanel } from "@/lib/chat-tools";

import type { ToolId } from "./types";

export type ToolLabelKey =
  | "toolsWebSearch"
  | "toolsMap"
  | "toolsResearch"
  | "toolsWorksheet";

export type ToolMenuKind =
  | "toggle-web-search"
  | "toggle-research"
  | "toggle-worksheet"
  | "toggle-map"
  | "open-panel";

export type ToolUiConfig = {
  icon: LucideIcon;
  labelKey: ToolLabelKey;
  kind: ToolMenuKind;
  panel?: RightSidebarPanel;
  /** Panel id when shown in the right tools rail (sidebar panels only). */
  railPanel?: RightSidebarPanel;
};

export const TOOL_DISPLAY_ORDER: ToolId[] = [
  "web-search",
  "map",
  "research",
  "worksheet",
];

export const TOOL_UI_CONFIG: Record<ToolId, ToolUiConfig> = {
  "web-search": {
    icon: Globe,
    labelKey: "toolsWebSearch",
    kind: "toggle-web-search",
    railPanel: "web-search",
  },
  worksheet: {
    icon: FileText,
    labelKey: "toolsWorksheet",
    kind: "toggle-worksheet",
    railPanel: "worksheet",
  },
  map: {
    icon: Map,
    labelKey: "toolsMap",
    kind: "toggle-map",
    panel: "map",
    railPanel: "map",
  },
  research: {
    icon: Search,
    labelKey: "toolsResearch",
    kind: "toggle-research",
    railPanel: "research",
  },
};