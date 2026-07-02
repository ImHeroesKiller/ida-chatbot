import type { ToolId } from "@/components/chat/tools/types";
import type { RightSidebarPanel } from "@/lib/chat-tools";

/** Viewport must be at least this wide to use Worksheet / Workflow. */
export const HEAVY_TOOLS_MIN_WIDTH = 1024;

export const HEAVY_TOOL_IDS = ["worksheet", "workflow"] as const;

export type HeavyToolId = (typeof HEAVY_TOOL_IDS)[number];

export const HEAVY_TOOL_PANELS: RightSidebarPanel[] = ["worksheet", "workflow"];

const MOBILE_UA_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export function isHeavyToolId(toolId: ToolId): toolId is HeavyToolId {
  return (HEAVY_TOOL_IDS as readonly string[]).includes(toolId);
}

export function isHeavyToolPanel(
  panel: RightSidebarPanel,
): panel is "worksheet" | "workflow" {
  return panel === "worksheet" || panel === "workflow";
}

export function isMobileUserAgent(userAgent: string): boolean {
  return MOBILE_UA_PATTERN.test(userAgent);
}

export function isNarrowViewportForHeavyTools(width: number): boolean {
  return width < HEAVY_TOOLS_MIN_WIDTH;
}

export function shouldAllowHeavyTools(options: {
  viewportWidth: number;
  userAgent: string;
}): boolean {
  return (
    !isNarrowViewportForHeavyTools(options.viewportWidth) &&
    !isMobileUserAgent(options.userAgent)
  );
}

export const HEAVY_TOOLS_DESKTOP_NOTICE_EVENT = "ida:heavy-tools-desktop-notice";

export function dispatchHeavyToolsDesktopNotice(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HEAVY_TOOLS_DESKTOP_NOTICE_EVENT));
}