import type { ModelProvider } from "@/lib/admin/models";

export interface IdaAppConfig {
  defaultModel: {
    id: string;
    provider: ModelProvider;
  };
  features: {
    rag: boolean;
    voice: boolean;
    ocr: boolean;
    autoSpeak: boolean;
  };
  systemPromptOverride: string | null;
  rag: {
    confidenceThreshold: number;
    topK: number;
    retrievalThreshold: number;
  };
  modelPricing?: Record<
    string,
    { inputPer1M: number; outputPer1M: number }
  >;
}

export type RequestLogStatus = "success" | "error" | "rate_limit";

export interface RequestLogRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  model: string;
  provider: string;
  route: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  status: RequestLogStatus;
  error_message: string | null;
  created_at: string;
}

export interface ModelUsageStat {
  model: string;
  provider: string;
  count: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface DailySummary {
  date: string;
  label: string;
  requests: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface TopActor {
  id: string;
  type: "user" | "session";
  requests: number;
  totalTokens: number;
}

export interface ModelHealthStatus {
  model: string;
  provider: string;
  status: "active" | "degraded" | "down" | "unconfigured";
  successRate: number;
  recentErrors: number;
  lastSeen: string | null;
}

export interface AdminAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

export interface AdminStats {
  todayTotal: number;
  last7DaysTotal: number;
  monthTotal: number;
  todayTokens: number;
  last7DaysTokens: number;
  monthTokens: number;
  todayCostUsd: number;
  monthCostUsd: number;
  topModel: { model: string; provider: string; count: number } | null;
  dailyByModel: Array<{
    date: string;
    model: string;
    provider: string;
    count: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
  chartDays: Array<{
    date: string;
    label: string;
    byModel: Record<string, number>;
    byModelTokens: Record<string, number>;
    total: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
  modelTotals: ModelUsageStat[];
  dailySummaries: DailySummary[];
  topUsers: TopActor[];
  topSessions: TopActor[];
  modelHealth: ModelHealthStatus[];
  alerts: AdminAlert[];
  recentActivity: RequestLogRow[];
}