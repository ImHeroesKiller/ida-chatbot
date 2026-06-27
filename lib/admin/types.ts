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
}

export interface RequestLogRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  model: string;
  provider: string;
  route: string;
  created_at: string;
}

export interface AdminStats {
  todayTotal: number;
  last7DaysTotal: number;
  topModel: { model: string; provider: string; count: number } | null;
  dailyByModel: Array<{
    date: string;
    model: string;
    provider: string;
    count: number;
  }>;
  chartDays: Array<{
    date: string;
    label: string;
    byModel: Record<string, number>;
    total: number;
  }>;
  modelTotals: Array<{
    model: string;
    provider: string;
    count: number;
  }>;
}