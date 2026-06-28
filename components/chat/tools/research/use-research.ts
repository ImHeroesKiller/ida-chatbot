"use client";

import { useCallback, useState } from "react";

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

export function useResearch() {
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

  const toggleTool = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      setIsPanelOpen(next);
      if (!next) {
        setIsResearching(false);
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
      setIsResearching(false);
    }
  }, []);

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
    setResearchResults(null);
    setCurrentSession(null);
    setError(null);
    setIsResearching(false);
  }, []);

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

  const resetForNewChat = useCallback(() => {
    setIsEnabled(false);
    setIsPanelOpen(false);
    setResearchSessions([]);
    setCurrentSession(null);
    setResearchResults(null);
    setIsResearching(false);
    setError(null);
  }, []);

  const hydrateFromChat = useCallback(
    (params: {
      enabled: boolean;
      sessions: ResearchSession[];
      lastResult?: ResearchResult | null;
    }) => {
      setIsEnabled(params.enabled);
      setResearchSessions(params.sessions);
      if (params.lastResult) {
        setResearchResults(params.lastResult);
        setCurrentSession({
          id: createResearchSessionId(),
          topic: params.lastResult.topic,
          depth: params.lastResult.depth,
          summary: params.lastResult.summary,
          sources: params.lastResult.sources,
          queries: params.lastResult.queries,
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

  return {
    isEnabled,
    isPanelOpen,
    researchSessions,
    currentSession,
    isResearching,
    researchResults,
    error,
    toggleTool,
    openPanel,
    closePanel,
    setEnabled,
    setSessions,
    startResearch,
    beginChatResearch,
    endChatResearch,
    saveResearchSession,
    clearResults,
    applyResearchFromMessage,
    resetForNewChat,
    hydrateFromChat,
  };
}