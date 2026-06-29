import type { ToolRuntimeBundle } from "@/components/chat/tools/tool-coordinator-config";
import type { TOOL_UI_CONFIG } from "@/components/chat/tools/tool-ui-config";
import type { ToolId } from "@/components/chat/tools/types";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";

export interface ToolRailItem {
  id: ToolId;
  panel: RightSidebarPanel;
  labelKey: (typeof TOOL_UI_CONFIG)[ToolId]["labelKey"];
  icon: (typeof TOOL_UI_CONFIG)[ToolId]["icon"];
  isEnabled: boolean;
  isExpanded: boolean;
  isArmed: boolean;
  isDisabled: boolean;
}

export interface ToolSendFlags {
  worksheetAtSend: boolean;
  webSearchAtSend: boolean;
  researchAtSend: boolean;
}

export interface ToolAvailabilityFlags {
  webSearchAvailable: boolean;
  researchAvailable: boolean;
  isWorksheetAvailable: boolean;
  isWebSearchAvailable: boolean;
  isResearchAvailable: boolean;
  isMapAvailable: boolean;
}

export type ToolPersistPatch = Pick<
  ChatSession,
  | "activeRightPanel"
  | "worksheetToolEnabled"
  | "webSearchEnabled"
  | "researchEnabled"
  | "mapEnabled"
  | "researchSessions"
  | "mapViewState"
>;

export interface ToolPanelCoordinator {
  activePanel: RightSidebarPanel | null;
  openPanel: (panel: RightSidebarPanel) => void;
  togglePanel: (panel: RightSidebarPanel) => void;
  collapsePanel: () => void;
}

export interface ToolPersistenceCoordinator {
  hydrateFromChat: (chat: ChatSession) => void;
  resetForNewChat: () => void;
  getPersistPatch: () => ToolPersistPatch;
}

export interface ToolUiCoordinator {
  isAnyToolActive: boolean;
  isToolActive: (toolId: ToolId) => boolean;
  handleMenuToolClick: (toolId: ToolId) => void;
  handleRailClick: (toolId: ToolId, panel: RightSidebarPanel) => void;
  railItems: ToolRailItem[];
  setWorksheetEnabled: (enabled: boolean) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  setResearchEnabled: (enabled: boolean) => void;
  setMapEnabled: (enabled: boolean) => void;
  activateWorksheet: () => void;
  activateWebSearch: () => void;
  activateResearch: () => void;
  activateMap: () => void;
}

/** Live tool hook instances (worksheet, web-search, research, map). */
export type { ToolRuntimeBundle };

export type ToolsCoordinator = ToolRuntimeBundle &
  ToolPanelCoordinator &
  ToolPersistenceCoordinator &
  ToolUiCoordinator &
  ToolSendFlags &
  ToolAvailabilityFlags;

/** SSE stream side-effects: activate tools and update search/research state. */
export type StreamToolCoordinator = ToolRuntimeBundle &
  Pick<ToolPanelCoordinator, "openPanel"> &
  Pick<
    ToolUiCoordinator,
    "activateWorksheet" | "activateWebSearch" | "activateResearch"
  >;

/** Send/regenerate/edit: armed flags, pre-send setup, and stream activations. */
export type ToolSendCoordinator = ToolRuntimeBundle &
  Pick<ToolPanelCoordinator, "openPanel"> &
  ToolSendFlags &
  Pick<
    ToolUiCoordinator,
    "activateWorksheet" | "activateWebSearch" | "activateResearch"
  >;

/** Chat session sync: hydrate, reset, and persist tool state. */
export type ToolSessionCoordinator = ToolRuntimeBundle &
  ToolPanelCoordinator &
  ToolPersistenceCoordinator;

/** Right panel handlers: research/web-search actions and worksheet activation. */
export type ToolPanelHandlerCoordinator = ToolRuntimeBundle &
  Pick<ToolPanelCoordinator, "openPanel" | "collapsePanel"> &
  Pick<ToolUiCoordinator, "activateWorksheet">;