"use client";

import { useCallback, useState } from "react";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { Locale } from "@/lib/config";
import {
  mapResearchApiError,
  resolveResearchErrorMessage,
} from "@/lib/research-format";
import type {
  ResearchDepth,
  ResearchSession,
  ResearchSource,
} from "@/lib/research-types";
import { createResearchSessionId } from "@/lib/research-types";

export interface ResearchResult {
  topic: string;
  depth: ResearchDepth;
  summary: string;
  sources: ResearchSource[];
  queries: string[];
}

const PANEL_ID = TOOL_PANEL_IDS.research;

export interface ResearchHydrationInput extends ToolHydrationInput {
  /** Saved research sessions from the chat session. */
  sessions?: ResearchSession[];
  /** Most recent research result reconstructed from chat messages. */
  lastResult?: ResearchResult | null;
}

export type ResearchTool = BaseToolState &
  BaseToolLifecycle<ResearchHydrationInput> & {
    // --- Tool-specific state ---
    researchSessions: ResearchSession[];
    currentSession: ResearchSession | null;
    isResearching: boolean;
    researchResults: ResearchResult | null;
    error: string | null;

    // --- Tool-specific actions ---
    setSessions: (sessions: ResearchSession[]) => void;
    startResearch: (
      topic: string,
      depth: ResearchDepth,
      locale: Locale,
    ) => Promise<void>;
    beginChatResearch: () => void;
    endChatResearch: () => void;
    saveResearchSession: () => ResearchSession | null;
    clearResults: () => void;
    applyResearchFromMessage: (params: {
      topic: string;
      summary: string;
      sources: ResearchSource[];
      queries: string[];
      depth?: ResearchDepth;
    }) => void;
  };

/**
 * Manages research armed/panel state, sessions, and ephemeral results.
 *
 * Panel-initiated research calls `startResearch` (API). Chat-stream research
 * uses `beginChatResearch` / `applyResearchFromMessage` / `endChatResearch`.
 */
export function useResearch(): ResearchTool {
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(
    null,
  );
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<ResearchResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const clearResearchData = useCallback(() => {
    setResearchResults(null);
    setCurrentSession(null);
    setError(null);
    setIsResearching(false);
  }, []);

  const hydrateResearchData = useCallback((state: ResearchHydrationInput) => {
    setResearchSessions(state.sessions ?? []);

    if (state.lastResult) {
      setResearchResults(state.lastResult);
      setCurrentSession({
        id: createResearchSessionId(),
        topic: state.lastResult.topic,
        depth: state.lastResult.depth,
        summary: state.lastResult.summary,
        sources: state.lastResult.sources,
        queries: state.lastResult.queries,
        createdAt: Date.now(),
        savedAt: 0,
      });
    } else {
      setResearchResults(null);
      setCurrentSession(null);
    }

    setError(null);
    setIsResearching(false);
  }, []);

  const resetResearchData = useCallback(() => {
    setResearchSessions([]);
    clearResearchData();
  }, [clearResearchData]);

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
  } = useBaseToolState<ResearchHydrationInput>(PANEL_ID, {
    onDisable: clearResearchData,
    onHydrate: hydrateResearchData,
    onReset: resetResearchData,
  });

  // --- Tool-specific actions ---
  const setSessions = useCallback((sessions: ResearchSession[]) => {
    setResearchSessions(sessions);
  }, []);

  const startResearch = useCallback(
    async (topic: string, depth: ResearchDepth, locale: Locale) => {
      const trimmed = topic.trim();
      if (!trimmed) return;

      setIsResearching(true);
      setError(null);
      setCurrentSession(null);

      try {
        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: trimmed, depth, locale }),
        });

        const data = (await response.json()) as ResearchResult & {
          error?: string;
        };

        if (!response.ok) {
          const mapped = mapResearchApiError(response.status, data);
          throw new Error(
            resolveResearchErrorMessage(mapped.code, locale, mapped.message),
          );
        }

        const result: ResearchResult = {
          topic: data.topic ?? trimmed,
          depth: data.depth ?? depth,
          summary: data.summary ?? "",
          sources: data.sources ?? [],
          queries: data.queries ?? [],
        };

        if (!result.sources.length) {
          throw new Error(resolveResearchErrorMessage("no_results", locale));
        }

        setResearchResults(result);
        setCurrentSession({
          id: createResearchSessionId(),
          topic: result.topic,
          depth: result.depth,
          summary: result.summary,
          sources: result.sources,
          queries: result.queries,
          createdAt: Date.now(),
          savedAt: 0,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : resolveResearchErrorMessage("unknown", locale);
        setError(message);
        setResearchResults(null);
      } finally {
        setIsResearching(false);
      }
    },
    [],
  );

  const saveResearchSession = useCallback(() => {
    if (!currentSession) return null;

    const saved: ResearchSession = {
      ...currentSession,
      savedAt: Date.now(),
    };

    setResearchSessions((prev) => [saved, ...prev]);
    return saved;
  }, [currentSession]);

  const beginChatResearch = useCallback(() => {
    setIsResearching(true);
    setError(null);
  }, []);

  const endChatResearch = useCallback(() => {
    setIsResearching(false);
  }, []);

  const clearResults = useCallback(() => {
    clearResearchData();
  }, [clearResearchData]);

  const applyResearchFromMessage = useCallback(
    (params: {
      topic: string;
      summary: string;
      sources: ResearchSource[];
      queries: string[];
      depth?: ResearchDepth;
    }) => {
      const result: ResearchResult = {
        topic: params.topic,
        depth: params.depth ?? "standard",
        summary: params.summary,
        sources: params.sources,
        queries: params.queries,
      };

      setResearchResults(result);
      setCurrentSession({
        id: createResearchSessionId(),
        topic: result.topic,
        depth: result.depth,
        summary: result.summary,
        sources: result.sources,
        queries: result.queries,
        createdAt: Date.now(),
        savedAt: 0,
      });
      setError(null);
      setIsResearching(false);
    },
    [],
  );

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    researchSessions,
    currentSession,
    isResearching,
    researchResults,
    error,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    setSessions,
    startResearch,
    beginChatResearch,
    endChatResearch,
    saveResearchSession,
    clearResults,
    applyResearchFromMessage,
    hydrate,
    resetForNewChat,
  };
}