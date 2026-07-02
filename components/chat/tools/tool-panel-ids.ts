import type { RightSidebarPanel } from "@/lib/chat-tools";

import type { ToolId } from "./types";

export const TOOL_PANEL_IDS = {
  worksheet: "worksheet",
  workflow: "workflow",
  "web-search": "web-search",
  research: "research",
  map: "map",
  "image-gen": "image-gen",
  "video-gen": "video-gen",
  "music-gen": "music-gen",
} as const satisfies Record<ToolId, RightSidebarPanel>;

export function isToggleToolPanel(
  panel: RightSidebarPanel,
): panel is "worksheet" | "workflow" | "web-search" | "research" | "map" {
  return (
    panel === "worksheet" ||
    panel === "workflow" ||
    panel === "web-search" ||
    panel === "research" ||
    panel === "map"
    // media gen tools (image-gen etc) use "open-panel" kind, not toggle
  );
}