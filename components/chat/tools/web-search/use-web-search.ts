"use client";

import { useCallback, useState } from "react";

import {
  createBaseToolActions,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { IdaWebSearchSource } from "@/lib/types";

export type WebSearchResult = IdaWebSearchSource;

const PANEL_ID = TOOL_PANEL_IDS["web-search"];

export function useWebSearch(): BaseToolState & {
  searchResults: WebSearchResult[];
  isSearching: boolean;
  lastQuery: string | null;
  error: string | null;
  setSearchResults: (results: WebSearchResult[]) => void;
  setLastQuery: (query: string | null) => void;
  clearResults: () => void;
  beginSearch: (query: string) => void;
  finishSearchError: (message: string) => void;
  endSearch: () => void;
  hydrate: (state: ToolHydrationInput & { results?: WebSearchResult[] }) => void;
  resetForNewChat: () => void;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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
      setIsEnabled,
      setIsPanelOpen,
      onDisable: clearSearchData,
    },
  );

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

  const hydrate = useCallback(
    (state: ToolHydrationInput & { results?: WebSearchResult[] }) => {
      setIsEnabled(state.enabled);
      setIsPanelOpen(Boolean(state.panelOpen));
      if (state.results?.length) {
        setSearchResultsState(state.results);
      } else {
        setSearchResultsState([]);
      }
      setLastQuery(null);
      setError(null);
      setIsSearching(false);
    },
    [],
  );

  const resetForNewChat = useCallback(() => {
    setIsEnabled(false);
    setIsPanelOpen(false);
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