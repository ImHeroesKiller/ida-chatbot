export type RightSidebarPanel = "worksheet" | "map" | "research";

export type ChatToolId = "webSearch" | RightSidebarPanel;

export function normalizeRightSidebarPanel(
  panel: string | null | undefined,
): RightSidebarPanel | null {
  if (panel === "worksheet" || panel === "canvas") return "worksheet";
  if (panel === "map" || panel === "research") return panel;
  return null;
}