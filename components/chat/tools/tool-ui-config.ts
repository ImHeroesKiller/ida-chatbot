import { FileText, GitBranch, Globe, ImageIcon, Map, Music, Search, Video, type LucideIcon } from "lucide-react";

import type { RightSidebarPanel } from "@/lib/chat-tools";

import type { ToolId } from "./types";

export type ToolLabelKey =
  | "toolsWebSearch"
  | "toolsMap"
  | "toolsResearch"
  | "toolsWorksheet"
  | "toolsWorkflow"
  | "toolsImageGen"
  | "toolsVideoGen"
  | "toolsMusicGen";

export type ToolMenuKind =
  | "toggle-web-search"
  | "toggle-research"
  | "toggle-worksheet"
  | "toggle-workflow"
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
  "workflow",
  "image-gen",
  "video-gen",
  "music-gen",
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
  workflow: {
    icon: GitBranch,
    labelKey: "toolsWorkflow",
    kind: "toggle-workflow",
    railPanel: "workflow",
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
  "image-gen": {
    icon: ImageIcon,
    labelKey: "toolsImageGen",
    kind: "open-panel",
    panel: "image-gen",
    railPanel: "image-gen",
  },
  "video-gen": {
    icon: Video,
    labelKey: "toolsVideoGen",
    kind: "open-panel",
    panel: "video-gen",
    railPanel: "video-gen",
  },
  "music-gen": {
    icon: Music,
    labelKey: "toolsMusicGen",
    kind: "open-panel",
    panel: "music-gen",
    railPanel: "music-gen",
  },
};