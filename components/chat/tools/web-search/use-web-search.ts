"use client";

import { useCallback, useState } from "react";

import type { IdaWebSearchSource } from "@/lib/types";

export type WebSearchResult = IdaWebSearchSource;

export function useWebSearch() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchResults, setSearchResultsState] = useState<WebSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTool = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      setIsPanelOpen(next);
      if (!next) {
        setIsSearching(false);
      }
      return next;
    });
  }, []);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setIsEnabled(value);
    if (!value) {
      setIsPanelOpen(false);
      setIsSearching(false);
    }
  }, []);

  const setSearchResults = useCallback((results: WebSearchResult[]) => {
    setSearchResultsState(results);
    setIsSearching(false);
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setSearchResultsState([]);
    setLastQuery(null);
    setError(null);
    setIsSearching(false);
  }, []);

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

  const resetForNewChat = useCallback(() => {
    setIsEnabled(false);
    setIsPanelOpen(false);
    setSearchResultsState([]);
    setIsSearching(false);
    setLastQuery(null);
    setError(null);
  }, []);

  return {
    isEnabled,
    isPanelOpen,
    searchResults,
    isSearching,
    lastQuery,
    error,
    toggleTool,
    openPanel,
    closePanel,
    setEnabled,
    setSearchResults,
    setLastQuery,
    clearResults,
    beginSearch,
    finishSearchError,
    endSearch,
    resetForNewChat,
  };
}