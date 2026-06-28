import type { RightSidebarPanel } from "@/lib/chat-tools";

export interface BaseToolState {
  panelId: RightSidebarPanel;
  isEnabled: boolean;
  isPanelOpen: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleTool: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export interface ToolHydrationInput {
  enabled: boolean;
  panelOpen?: boolean;
}

export function resolveToolEnabled(
  persistedEnabled: boolean | undefined,
  activePanel: RightSidebarPanel | null | undefined,
  panelId: RightSidebarPanel,
  toolAvailable: boolean,
): boolean {
  if (!toolAvailable) return false;
  return persistedEnabled ?? activePanel === panelId;
}

export function createBaseToolActions(options: {
  setIsEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  onDisable?: () => void;
}) {
  const { setIsEnabled, setIsPanelOpen, onDisable } = options;

  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setIsPanelOpen(false);
      onDisable?.();
    }
  };

  const openPanel = () => {
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const toggleTool = () => {
    setIsEnabled((prev) => {
      const next = !prev;
      setIsPanelOpen(next);
      if (!next) {
        onDisable?.();
      }
      return next;
    });
  };

  return { setEnabled, openPanel, closePanel, toggleTool };
}