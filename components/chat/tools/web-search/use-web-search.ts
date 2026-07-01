"use client";

import { useCallback, useMemo, useState } from "react";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { ToolQuotaState } from "@/components/chat/tools/types";
import type { IdaWebSearchSource } from "@/lib/types";

import {
  createWebSearchQuotaState,
  WEB_SEARCH_QUOTA_DEFAULTS,
} from "./web-search-quota";

export type WebSearchResult = IdaWebSearchSource;

const PANEL_ID = TOOL_PANEL_IDS["web-search"];

export interface WebSearchHydrationInput extends ToolHydrationInput {
  /** Last web-search results from chat messages, if any. */
  results?: WebSearchResult[];
}

export type WebSearchTool = BaseToolState &
  BaseToolLifecycle<WebSearchHydrationInput> & {
    searchResults: WebSearchResult[];
    isSearching: boolean;
    lastQuery: string | null;
    error: string | null;
    /** Placeholder quota state — not enforced until account management exists. */
    quota: ToolQuotaState;
    setSearchResults: (results: WebSearchResult[]) => void;
    setLastQuery: (query: string | null) => void;
    clearResults: () => void;
    beginSearch: (query: string) => void;
    finishSearchError: (message: string) => void;
    endSearch: () => void;
  };

/**
 * Web Search tool hook — implements `BaseToolState` and is registered via
 * `useToolsCoordinator` → `useToolRuntime`. Multiple tools may stay armed;
 * the coordinator only enforces exclusive sidebar panels.
 */
export function useWebSearch(): WebSearchTool {
  const [searchResults, setSearchResultsState] = useState<WebSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<ToolQuotaState>(createWebSearchQuotaState);

  const clearSearchData = useCallback(() => {
    setSearchResultsState([]);
    setLastQuery(null);
    setError(null);
    setIsSearching(false);
  }, []);

  const resetQuota = useCallback(() => {
    setQuota(createWebSearchQuotaState());
  }, []);

  const hydrateSearchData = useCallback((state: WebSearchHydrationInput) => {
    setSearchResultsState(state.results?.length ? state.results : []);
    setLastQuery(null);
    setError(null);
    setIsSearching(false);
  }, []);

  const {
    panelId,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  } = useBaseToolState<WebSearchHydrationInput>(PANEL_ID, {
    onDisable: clearSearchData,
    onHydrate: hydrateSearchData,
    onReset: () => {
      clearSearchData();
      resetQuota();
    },
  });

  const setSearchResults = useCallback((results: WebSearchResult[]) => {
    setSearchResultsState(results);
    setIsSearching(false);
    setError(null);

    // TODO: Integrate with admin account management for per-user quota
    if (WEB_SEARCH_QUOTA_DEFAULTS.enabled && results.length > 0) {
      setQuota((current) => ({
        ...current,
        used: current.used + 1,
      }));
    }
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

  const quotaSnapshot = useMemo(() => ({ ...quota }), [quota]);

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    searchResults,
    isSearching,
    lastQuery,
    error,
    quota: quotaSnapshot,
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