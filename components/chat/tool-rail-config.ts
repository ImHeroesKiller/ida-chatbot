import {
  Code2,
  FileText,
  GitBranch,
  Globe,
  ImageIcon,
  Laptop,
  Map,
  Music,
  Plug,
  Search,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { ToolId } from "@/components/chat/tools/types";
import type { RightSidebarPanel } from "@/lib/chat-tools";

export type ToolRailPlaceholderId =
  | "workflow"
  | "image"
  | "video"
  | "music"
  | "coding"
  | "integration"
  | "virtual-computer";

export type ToolRailEntryId = ToolId | ToolRailPlaceholderId;

export type ToolRailLabelKey =
  | "toolsWebSearch"
  | "toolsMap"
  | "toolsResearch"
  | "toolsWorksheet"
  | "toolsWorkflow"
  | "toolsImage"
  | "toolsVideo"
  | "toolsMusic"
  | "toolsCoding"
  | "toolsIntegration"
  | "toolsVirtualComputer";

export type ToolRailGroupLabelKey =
  | "railResearchTools"
  | "railProductivity"
  | "railCreativeTools"
  | "railAdvancedTools";

export interface ToolRailGroupConfig {
  id: string;
  labelKey: ToolRailGroupLabelKey;
  entries: ToolRailEntryConfig[];
}

export interface ToolRailEntryConfig {
  id: ToolRailEntryId;
  labelKey: ToolRailLabelKey;
  icon: LucideIcon;
  panel?: RightSidebarPanel;
  comingSoon?: boolean;
}

export const TOOL_RAIL_GROUPS: ToolRailGroupConfig[] = [
  {
    id: "research",
    labelKey: "railResearchTools",
    entries: [
      { id: "web-search", labelKey: "toolsWebSearch", icon: Globe, panel: "web-search" },
      { id: "map", labelKey: "toolsMap", icon: Map, panel: "map" },
      { id: "research", labelKey: "toolsResearch", icon: Search, panel: "research" },
    ],
  },
  {
    id: "productivity",
    labelKey: "railProductivity",
    entries: [
      { id: "worksheet", labelKey: "toolsWorksheet", icon: FileText, panel: "worksheet" },
      {
        id: "workflow",
        labelKey: "toolsWorkflow",
        icon: GitBranch,
        comingSoon: true,
      },
    ],
  },
  {
    id: "creative",
    labelKey: "railCreativeTools",
    entries: [
      { id: "image", labelKey: "toolsImage", icon: ImageIcon, comingSoon: true },
      { id: "video", labelKey: "toolsVideo", icon: Video, comingSoon: true },
      { id: "music", labelKey: "toolsMusic", icon: Music, comingSoon: true },
    ],
  },
  {
    id: "advanced",
    labelKey: "railAdvancedTools",
    entries: [
      { id: "coding", labelKey: "toolsCoding", icon: Code2, comingSoon: true },
      {
        id: "integration",
        labelKey: "toolsIntegration",
        icon: Plug,
        comingSoon: true,
      },
      {
        id: "virtual-computer",
        labelKey: "toolsVirtualComputer",
        icon: Laptop,
        comingSoon: true,
      },
    ],
  },
];

export function isToolRailPlaceholder(
  id: ToolRailEntryId,
): id is ToolRailPlaceholderId {
  return (
    id === "workflow" ||
    id === "image" ||
    id === "video" ||
    id === "music" ||
    id === "coding" ||
    id === "integration" ||
    id === "virtual-computer"
  );
}

