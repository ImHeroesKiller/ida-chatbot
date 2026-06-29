"use client";

import { useCallback, useRef, useState } from "react";

import type { RightSidebarPanel } from "@/lib/chat-tools";

/**
 * Shared panel lifecycle contract that every tool hook must implement.
 *
 * Tools extend this with tool-specific state (results, sessions, etc.) and
 * actions (search, research, clearResults). The coordinator (`useToolsCoordinator`)
 * depends on these two methods to restore and clear state across chat sessions.
 */
export interface BaseToolLifecycle<
  THydrate extends ToolHydrationInput = ToolHydrationInput,
> {
  /** Restore armed/panel state (and tool-specific data) from a persisted chat. */
  hydrate: (state: THydrate) => void;

  /** Reset all state when the user starts a new empty chat. */
  resetForNewChat: () => void;
}

/**
 * Minimum surface area shared by worksheet, web-search, and research hooks.
 *
 * Each hook returns `BaseToolState & BaseToolLifecycle & { …toolSpecific }`.
 * Panel visibility (`isPanelOpen`) and armed state (`isEnabled`) are independent:
 * a tool can be armed without its panel open, and vice versa — though
 * `toggleTool()` couples them for quick menu toggles.
 */
export interface BaseToolState {
  /** Right-sidebar panel id bound to this tool (see `tool-panel-ids.ts`). */
  panelId: RightSidebarPanel;

  /**
   * Whether the tool is armed for the next chat send or active feature use.
   * Persisted per chat session as `*ToolEnabled` flags.
   */
  isEnabled: boolean;

  /**
   * Whether this tool's sidebar panel is currently visible.
   * Only one panel is active at a time; the coordinator enforces exclusivity.
   */
  isPanelOpen: boolean;

  /**
   * Set armed state explicitly. Disabling also closes the panel and runs
   * optional `onDisable` cleanup (e.g. clearing ephemeral search results).
   */
  setEnabled: (enabled: boolean) => void;

  /**
   * Flip armed state. Enabling opens the panel; disabling closes it and
   * runs `onDisable` cleanup when provided to `createBaseToolActions`.
   */
  toggleTool: () => void;

  /** Open the sidebar panel without changing armed state. */
  openPanel: () => void;

  /** Close the sidebar panel without changing armed state. */
  closePanel: () => void;
}

/**
 * Input for `hydrate()` — maps persisted chat session fields to hook state.
 */
export interface ToolHydrationInput {
  /** Persisted armed state (`worksheetToolEnabled`, `webSearchEnabled`, etc.). */
  enabled: boolean;

  /** Whether this tool's panel was the active right panel when the chat was saved. */
  panelOpen?: boolean;
}

/**
 * Resolve whether a tool should be considered enabled after loading a chat.
 *
 * Prefers the persisted flag; falls back to whether the panel was active.
 * Returns `false` when the tool is not available in the registry.
 */
export function resolveToolEnabled(
  persistedEnabled: boolean | undefined,
  activePanel: RightSidebarPanel | null | undefined,
  panelId: RightSidebarPanel,
  toolAvailable: boolean,
): boolean {
  if (!toolAvailable) return false;
  return persistedEnabled ?? activePanel === panelId;
}

/** Apply base armed/panel fields during `hydrate()`. */
export function applyBaseHydration(
  state: ToolHydrationInput,
  setters: {
    setIsEnabled: (value: boolean) => void;
    setIsPanelOpen: (value: boolean) => void;
  },
): void {
  setters.setIsEnabled(state.enabled);
  setters.setIsPanelOpen(Boolean(state.panelOpen));
}

/** Reset base armed/panel fields during `resetForNewChat()`. */
export function resetBaseToolState(setters: {
  setIsEnabled: (value: boolean) => void;
  setIsPanelOpen: (value: boolean) => void;
}): void {
  setters.setIsEnabled(false);
  setters.setIsPanelOpen(false);
}

/**
 * Factory for the four panel-control actions shared by every tool hook.
 *
 * Pass `onDisable` to clear ephemeral tool data when the tool is turned off
 * (e.g. search results). Worksheet omits this because its content lives in
 * the chat session, not in the hook.
 */
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

/**
 * Standard async UI state for tools that call APIs or stream results.
 * Domain-specific names (`isSearching`, `isResearching`) are allowed in the
 * public tool type when they improve panel clarity.
 */
export interface ToolAsyncState {
  isLoading: boolean;
  error: string | null;
}

export const INITIAL_TOOL_ASYNC_STATE: ToolAsyncState = {
  isLoading: false,
  error: null,
};

export function resetToolAsyncState(setters: {
  setIsLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
}): void {
  setters.setIsLoading(false);
  setters.setError(null);
}

export interface UseBaseToolStateOptions<
  THydrate extends ToolHydrationInput = ToolHydrationInput,
> {
  /** Clears ephemeral tool data when the tool is disabled. Omit for session-backed tools. */
  onDisable?: () => void;
  /** Restores tool-specific state after base hydration fields are applied. */
  onHydrate?: (state: THydrate) => void;
  /** Clears tool-specific state when starting a new empty chat. */
  onReset?: () => void;
}

/**
 * Shared scaffold for every tool hook: armed state, panel visibility, and lifecycle.
 *
 * Tool hooks should call this once, then add tool-specific state and actions.
 */
export function useBaseToolState<
  THydrate extends ToolHydrationInput = ToolHydrationInput,
>(
  panelId: RightSidebarPanel,
  options: UseBaseToolStateOptions<THydrate> = {},
) {
  const { onDisable, onHydrate, onReset } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const baseSettersRef = useRef({ setIsEnabled, setIsPanelOpen });
  baseSettersRef.current = { setIsEnabled, setIsPanelOpen };

  const { setEnabled, openPanel, closePanel, toggleTool } = createBaseToolActions({
    ...baseSettersRef.current,
    onDisable,
  });

  const hydrate = useCallback(
    (state: THydrate) => {
      applyBaseHydration(state, baseSettersRef.current);
      onHydrate?.(state);
    },
    [onHydrate],
  );

  const resetForNewChat = useCallback(() => {
    resetBaseToolState(baseSettersRef.current);
    onReset?.();
  }, [onReset]);

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  };
}