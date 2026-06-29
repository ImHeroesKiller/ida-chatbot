"use client";

import { useCallback, useState } from "react";

import {
  applyBaseHydration,
  createBaseToolActions,
  resetBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { IdaWebSearchSource } from "@/lib/types";

export type WebSearchResult = IdaWebSearchSource;

const PANEL_ID = TOOL_PANEL_IDS["web-search"];

export interface WebSearchHydrationInput extends ToolHydrationInput {
  /** Last web-search results from chat messages, if any. */
  results?: WebSearchResult[];
}

export type WebSearchTool = BaseToolState &
  BaseToolLifecycle<WebSearchHydrationInput> & {
    // --- Tool-specific state ---
    searchResults: WebSearchResult[];
    isSearching: boolean;
    lastQuery: string | null;
    error: string | null;

    // --- Tool-specific actions ---
    setSearchResults: (results: WebSearchResult[]) => void;
    setLastQuery: (query: string | null) => void;
    clearResults: () => void;
    beginSearch: (query: string) => void;
    finishSearchError: (message: string) => void;
    endSearch: () => void;
  };

/**
 * Manages web-search armed/panel state plus ephemeral search results.
 *
 * Results are cleared when the tool is disabled (`onDisable`) or on new chat.
 * Chat-stream handlers call `beginSearch` / `setSearchResults` / `endSearch`.
 */
export function useWebSearch(): WebSearchTool {
  // --- Base state (shared across all tools) ---
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const baseSetters = { setIsEnabled, setIsPanelOpen };

  // --- Tool-specific state ---
  const [searchResults, setSearchResultsState] = useState<WebSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearSearchData = useCallback(() => {
    setSearchResultsState([]);
    setLastQuery(null);
    setError(null);
    setIsSearching(false);
  }, []);

  const { setEnabled, openPanel, closePanel, toggleTool } = createBaseToolActions(
    {
      ...baseSetters,
      onDisable: clearSearchData,
    },
  );

  // --- Tool-specific actions ---
  const setSearchResults = useCallback((results: WebSearchResult[]) => {
    setSearchResultsState(results);
    setIsSearching(false);
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    clearSearchData();
  }, [clearSearchData]);

  const beginSearch = useCallback((query: string) => {
    setLastQuery(query.trim() || null);
    setIsSearching(true);
    setError(null);
  }, []);

  const finishSearchError = useCallback((message: string) => {
    setIsSearching(false);
    setError(message);
  }, []);

  const endSearch = useCallback(() => {
    setIsSearching(false);
  }, []);

  // --- Lifecycle (hydrate / reset) ---
  const hydrate = useCallback((state: WebSearchHydrationInput) => {
    applyBaseHydration(state, baseSetters);
    setSearchResultsState(state.results?.length ? state.results : []);
    setLastQuery(null);
    setError(null);
    setIsSearching(false);
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState(baseSetters);
    clearSearchData();
  }, [clearSearchData]);

  return {
    panelId: PANEL_ID,
    isEnabled,
    isPanelOpen,
    searchResults,
    isSearching,
    lastQuery,
    error,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    setSearchResults,
    setLastQuery,
    clearResults,
    beginSearch,
    finishSearchError,
    endSearch,
    hydrate,
    resetForNewChat,
  };
}