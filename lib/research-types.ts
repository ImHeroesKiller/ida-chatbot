import type { IdaWebSearchSource } from "@/lib/types";

export type ResearchDepth = "quick" | "standard" | "deep";

export interface ResearchSource extends IdaWebSearchSource {
  query?: string;
}

export interface ResearchSession {
  id: string;
  topic: string;
  depth: ResearchDepth;
  summary: string;
  sources: ResearchSource[];
  queries: string[];
  createdAt: number;
  savedAt: number;
}

export function createResearchSessionId(): string {
  return `research-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}