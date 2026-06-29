import type { RightSidebarPanel } from "@/lib/chat-tools";

import type { ToolId } from "./types";

export const TOOL_PANEL_IDS = {
  worksheet: "worksheet",
  "web-search": "web-search",
  research: "research",
  map: "map",
} as const satisfies Record<ToolId, RightSidebarPanel>;

export function isToggleToolPanel(
  panel: RightSidebarPanel,
): panel is "worksheet" | "web-search" | "research" | "map" {
  return (
    panel === "worksheet" ||
    panel === "web-search" ||
    panel === "research" ||
    panel === "map"
  );
}