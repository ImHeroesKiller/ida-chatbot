export type RightSidebarPanel =
  | "worksheet"
  | "workflow"
  | "web-search"
  | "map"
  | "research"
  | "image-gen"
  | "video-gen"
  | "music-gen";

export type ChatToolId = "webSearch" | RightSidebarPanel;

export function normalizeRightSidebarPanel(
  panel: string | null | undefined,
): RightSidebarPanel | null {
  if (panel === "worksheet" || panel === "canvas") return "worksheet";
  if (panel === "workflow") return "workflow";
  if (panel === "web-search" || panel === "websearch") return "web-search";
  if (panel === "map" || panel === "research") return panel;
  return null;
}