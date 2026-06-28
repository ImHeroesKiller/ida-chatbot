"use client";

import { useCallback, useState } from "react";

import {
  createBaseToolActions,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { Locale } from "@/lib/config";
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

export function useResearch(): BaseToolState & {
  researchSessions: ResearchSession[];
  currentSession: ResearchSession | null;
  isResearching: boolean;
  researchResults: ResearchResult | null;
  error: string | null;
  setSessions: (sessions: ResearchSession[]) => void;
  startResearch: (topic: string, depth: ResearchDepth, locale: Locale) => Promise<void>;
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
  hydrate: (
    state: ToolHydrationInput & {
      sessions?: ResearchSession[];
      lastResult?: ResearchResult | null;
    },
  ) => void;
  resetForNewChat: () => void;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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

  const { setEnabled, openPanel, closePanel, toggleTool } = createBaseToolActions(
    {
      setIsEnabled,
      setIsPanelOpen,
      onDisable: clearResearchData,
    },
  );

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
          throw new Error(data.error ?? "Research failed.");
        }

        const result: ResearchResult = {
          topic: data.topic ?? trimmed,
          depth: data.depth ?? depth,
          summary: data.summary ?? "",
          sources: data.sources ?? [],
          queries: data.queries ?? [],
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Research request failed.";
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

  const hydrate = useCallback(
    (
      state: ToolHydrationInput & {
        sessions?: ResearchSession[];
        lastResult?: ResearchResult | null;
      },
    ) => {
      setIsEnabled(state.enabled);
      setIsPanelOpen(Boolean(state.panelOpen));
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
    },
    [],
  );

  const resetForNewChat = useCallback(() => {
    setIsEnabled(false);
    setIsPanelOpen(false);
    setResearchSessions([]);
    clearResearchData();
  }, [clearResearchData]);

  return {
    panelId: PANEL_ID,
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