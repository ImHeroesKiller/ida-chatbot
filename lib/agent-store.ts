"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import type { AgentWorkflowRun } from "@/lib/agent/types";
import type { Locale } from "@/lib/config";

const STORAGE_KEY = "ida-agent-store";
const MAX_RUNS = 20;

interface AgentStoreState {
  runs: AgentWorkflowRun[];
  currentRunId: string | null;
}

function createInitialStore(): AgentStoreState {
  return { runs: [], currentRunId: null };
}

function readStore(): AgentStoreState {
  if (typeof window === "undefined") return createInitialStore();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialStore();
    const parsed = JSON.parse(raw) as AgentStoreState;
    return {
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      currentRunId: parsed.currentRunId ?? null,
    };
  } catch {
    return createInitialStore();
  }
}

function writeStore(state: AgentStoreState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAgentStore(locale: Locale) {
  const { user } = useAuth();
  const [store, setStore] = useState<AgentStoreState>(createInitialStore);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(readStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStore(store);
  }, [store, hydrated]);

  const currentRun = useMemo(
    () => store.runs.find((run) => run.id === store.currentRunId) ?? null,
    [store.runs, store.currentRunId],
  );

  const upsertRun = useCallback((run: AgentWorkflowRun) => {
    setStore((prev) => {
      const existing = prev.runs.findIndex((item) => item.id === run.id);
      let runs = [...prev.runs];

      if (existing >= 0) {
        runs[existing] = run;
      } else {
        runs = [run, ...runs].slice(0, MAX_RUNS);
      }

      return { runs, currentRunId: run.id };
    });
  }, []);

  const selectRun = useCallback((runId: string) => {
    setStore((prev) => ({ ...prev, currentRunId: runId }));
  }, []);

  const newRun = useCallback(() => {
    setStore((prev) => ({ ...prev, currentRunId: null }));
  }, []);

  const deleteRun = useCallback((runId: string) => {
    setStore((prev) => {
      const runs = prev.runs.filter((run) => run.id !== runId);
      const currentRunId =
        prev.currentRunId === runId ? (runs[0]?.id ?? null) : prev.currentRunId;
      return { runs, currentRunId };
    });
  }, []);

  const clearRuns = useCallback(() => {
    setStore(createInitialStore());
  }, []);

  return {
    hydrated,
    userId: user?.id,
    runs: store.runs,
    currentRun,
    currentRunId: store.currentRunId,
    upsertRun,
    selectRun,
    newRun,
    deleteRun,
    clearRuns,
    locale,
  };
}