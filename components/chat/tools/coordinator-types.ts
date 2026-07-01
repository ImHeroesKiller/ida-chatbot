import type {
  ToolRailEntryId,
  ToolRailGroupLabelKey,
  ToolRailLabelKey,
} from "@/components/chat/tool-rail-config";
import type { ToolRuntimeBundle } from "@/components/chat/tools/tool-coordinator-config";
import type { ToolId } from "@/components/chat/tools/types";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { LucideIcon } from "lucide-react";

export interface ToolRailItem {
  id: ToolRailEntryId;
  panel?: RightSidebarPanel;
  labelKey: ToolRailLabelKey;
  icon: LucideIcon;
  isEnabled: boolean;
  isExpanded: boolean;
  isArmed: boolean;
  isDisabled: boolean;
  comingSoon?: boolean;
}

export interface ToolRailGroup {
  id: string;
  labelKey: ToolRailGroupLabelKey;
  items: ToolRailItem[];
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
  closeAllPanels: () => void;
}

export interface ToolPersistenceCoordinator {
  hydrateFromChat: (chat: ChatSession) => void;
  /** Close all panels, then reset every tool hook (preferred for New Chat). */
  resetAllTools: () => void;
  resetForNewChat: () => void;
  getPersistPatch: () => ToolPersistPatch;
}

export interface ToolToggleCoordinator {
  /** Toggle armed state + panel for one tool with exclusive panel open. */
  toggleTool: (toolId: ToolId) => void;
}

export interface ToolUiCoordinator {
  isAnyToolActive: boolean;
  isToolActive: (toolId: ToolId) => boolean;
  handleMenuToolClick: (toolId: ToolId) => void;
  handleRailClick: (toolId: ToolId, panel: RightSidebarPanel) => void;
  railGroups: ToolRailGroup[];
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
  ToolToggleCoordinator &
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