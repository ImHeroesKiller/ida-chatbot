import { getPlatformStats } from "@/lib/admin/platform-stats";
import { estimateRequestCost } from "@/lib/admin/pricing";
import type {
  AdminAlert,
  AdminStats,
  ModelHealthStatus,
  ModelUsageStat,
  RequestLogRow,
  RequestLogStatus,
  TopActor,
} from "@/lib/admin/types";
import type { TokenUsage } from "@/lib/admin/token-utils";
import { isProviderConfigured } from "@/lib/admin/models";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export interface LogRequestInput {
  userId?: string | null;
  sessionId?: string | null;
  model: string;
  provider: string;
  route?: string;
  usage?: TokenUsage;
  status?: RequestLogStatus;
  errorMessage?: string | null;
}

export async function logRequest(input: LogRequestInput): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const usage = input.usage ?? {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("ida_request_logs").insert({
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      model: input.model,
      provider: input.provider,
      route: input.route ?? "chat",
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
      status: input.status ?? "success",
      error_message: input.errorMessage ?? null,
    });
  } catch (error) {
    console.error("[IDA request-log]", error);
  }
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function monthStartIso(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return start.toISOString();
}

function buildEmptyChartDays(): AdminStats["chartDays"] {
  const days: AdminStats["chartDays"] = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    date.setUTCDate(date.getUTCDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    days.push({
      date: iso,
      label: formatDayLabel(iso),
      byModel: {},
      byModelTokens: {},
      total: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    });
  }

  return days;
}

function emptyStats(): AdminStats {
  return {
    todayTotal: 0,
    last7DaysTotal: 0,
    monthTotal: 0,
    todayTokens: 0,
    last7DaysTokens: 0,
    monthTokens: 0,
    todayCostUsd: 0,
    monthCostUsd: 0,
    topModel: null,
    dailyByModel: [],
    chartDays: buildEmptyChartDays(),
    modelTotals: [],
    dailySummaries: buildEmptyChartDays().map((day) => ({
      date: day.date,
      label: day.label,
      requests: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    })),
    topUsers: [],
    topSessions: [],
    modelHealth: [],
    alerts: [],
    recentActivity: [],
    platform: {
      totalUsers: 0,
      activeUsersToday: 0,
      activeUsersWeek: 0,
      totalChatSessions: 0,
      totalWorksheets: 0,
      totalResearchSessions: 0,
      activeUsers: [],
    },
  };
}

interface LogAggregateRow {
  model: string;
  provider: string;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  status: RequestLogStatus;
  error_message: string | null;
}

function accumulateActor(
  map: Map<string, TopActor>,
  id: string,
  type: TopActor["type"],
  tokens: number,
): void {
  const existing = map.get(id);
  if (existing) {
    existing.requests += 1;
    existing.totalTokens += tokens;
  } else {
    map.set(id, { id, type, requests: 1, totalTokens: tokens });
  }
}

function buildModelHealth(rows: LogAggregateRow[]): ModelHealthStatus[] {
  const byModel = new Map<
    string,
    { model: string; provider: string; success: number; errors: number; lastSeen: string }
  >();

  for (const row of rows) {
    const key = `${row.provider}:${row.model}`;
    const entry = byModel.get(key) ?? {
      model: row.model,
      provider: row.provider,
      success: 0,
      errors: 0,
      lastSeen: row.created_at,
    };

    if (row.status === "success") entry.success += 1;
    else entry.errors += 1;

    if (row.created_at > entry.lastSeen) entry.lastSeen = row.created_at;
    byModel.set(key, entry);
  }

  return [...byModel.values()].map((entry) => {
    const total = entry.success + entry.errors;
    const successRate = total > 0 ? entry.success / total : 1;
    const configured = isProviderConfigured(
      entry.provider as Parameters<typeof isProviderConfigured>[0],
    );

    let status: ModelHealthStatus["status"] = "active";
    if (!configured) status = "unconfigured";
    else if (entry.errors >= 3 && successRate < 0.5) status = "down";
    else if (entry.errors > 0 && successRate < 0.85) status = "degraded";

    return {
      model: entry.model,
      provider: entry.provider,
      status,
      successRate,
      recentErrors: entry.errors,
      lastSeen: entry.lastSeen,
    };
  });
}

function buildAlerts(options: {
  todayTokens: number;
  monthTokens: number;
  errorRate: number;
  modelHealth: ModelHealthStatus[];
}): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  if (options.errorRate >= 0.2) {
    alerts.push({
      id: "high-error-rate",
      severity: "critical",
      title: "High error rate",
      message: `${(options.errorRate * 100).toFixed(0)}% of recent requests failed.`,
    });
  } else if (options.errorRate >= 0.1) {
    alerts.push({
      id: "elevated-errors",
      severity: "warning",
      title: "Elevated errors",
      message: `${(options.errorRate * 100).toFixed(0)}% error rate in the last hour.`,
    });
  }

  if (options.todayTokens >= 500_000) {
    alerts.push({
      id: "token-limit-today",
      severity: "warning",
      title: "High token usage today",
      message: `${(options.todayTokens / 1000).toFixed(0)}K tokens used today.`,
    });
  }

  if (options.monthTokens >= 5_000_000) {
    alerts.push({
      id: "token-limit-month",
      severity: "info",
      title: "Monthly token volume",
      message: `${(options.monthTokens / 1_000_000).toFixed(2)}M tokens this month.`,
    });
  }

  const downModels = options.modelHealth.filter((item) => item.status === "down");
  for (const model of downModels.slice(0, 3)) {
    alerts.push({
      id: `model-down-${model.provider}-${model.model}`,
      severity: "critical",
      title: `Model down: ${model.model}`,
      message: `${model.recentErrors} recent errors (${(model.successRate * 100).toFixed(0)}% success).`,
    });
  }

  return alerts;
}

export async function getAdminStats(): Promise<AdminStats> {
  const empty = emptyStats();
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = getSupabaseAdmin();
    const since7 = new Date();
    since7.setUTCDate(since7.getUTCDate() - 6);
    since7.setUTCHours(0, 0, 0, 0);

    const since1h = new Date(Date.now() - 60 * 60 * 1000);
    const monthStart = monthStartIso();

    const [logsResult, recentResult, hourResult] = await Promise.all([
      supabase
        .from("ida_request_logs")
        .select(
          "model, provider, created_at, user_id, session_id, prompt_tokens, completion_tokens, total_tokens, status, error_message",
        )
        .gte("created_at", since7.toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("ida_request_logs")
        .select(
          "id, user_id, session_id, model, provider, route, prompt_tokens, completion_tokens, total_tokens, status, error_message, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("ida_request_logs")
        .select("status")
        .gte("created_at", since1h.toISOString()),
    ]);

    const data = (logsResult.data ?? []) as LogAggregateRow[];
    const recentActivity = (recentResult.data ?? []) as RequestLogRow[];
    const hourRows = hourResult.data ?? [];

    const todayIso = new Date().toISOString().slice(0, 10);
    const monthPrefix = monthStart.slice(0, 7);

    const chartDays = buildEmptyChartDays();
    const chartIndex = new Map(chartDays.map((day, index) => [day.date, index]));
    const dailyMap = new Map<
      string,
      {
        count: number;
        totalTokens: number;
        estimatedCostUsd: number;
      }
    >();
    const modelMap = new Map<string, ModelUsageStat>();
    const userMap = new Map<string, TopActor>();
    const sessionMap = new Map<string, TopActor>();

    let todayTotal = 0;
    let last7DaysTotal = 0;
    let monthTotal = 0;
    let todayTokens = 0;
    let last7DaysTokens = 0;
    let monthTokens = 0;
    let todayCostUsd = 0;
    let monthCostUsd = 0;

    for (const row of data) {
      const createdAt = row.created_at;
      const date = createdAt.slice(0, 10);
      const model = row.model;
      const provider = row.provider;
      const modelKey = `${provider}:${model}`;
      const tokens = row.total_tokens ?? 0;
      const usage = {
        promptTokens: row.prompt_tokens ?? 0,
        completionTokens: row.completion_tokens ?? 0,
        totalTokens: tokens,
      };
      const cost = estimateRequestCost({ provider, model, usage });

      last7DaysTotal += 1;
      last7DaysTokens += tokens;

      if (date === todayIso) {
        todayTotal += 1;
        todayTokens += tokens;
        todayCostUsd += cost;
      }

      if (createdAt.slice(0, 7) === monthPrefix) {
        monthTotal += 1;
        monthTokens += tokens;
        monthCostUsd += cost;
      }

      const dailyKey = `${date}|${modelKey}`;
      const dailyEntry = dailyMap.get(dailyKey) ?? {
        count: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
      };
      dailyEntry.count += 1;
      dailyEntry.totalTokens += tokens;
      dailyEntry.estimatedCostUsd += cost;
      dailyMap.set(dailyKey, dailyEntry);

      const modelEntry = modelMap.get(modelKey);
      if (modelEntry) {
        modelEntry.count += 1;
        modelEntry.promptTokens += usage.promptTokens;
        modelEntry.completionTokens += usage.completionTokens;
        modelEntry.totalTokens += tokens;
        modelEntry.estimatedCostUsd += cost;
      } else {
        modelMap.set(modelKey, {
          model,
          provider,
          count: 1,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: tokens,
          estimatedCostUsd: cost,
        });
      }

      const dayIndex = chartIndex.get(date);
      if (dayIndex !== undefined) {
        const day = chartDays[dayIndex]!;
        day.byModel[modelKey] = (day.byModel[modelKey] ?? 0) + 1;
        day.byModelTokens[modelKey] =
          (day.byModelTokens[modelKey] ?? 0) + tokens;
        day.total += 1;
        day.totalTokens += tokens;
        day.estimatedCostUsd += cost;
      }

      if (row.user_id) {
        accumulateActor(userMap, row.user_id, "user", tokens);
      }
      if (row.session_id) {
        accumulateActor(sessionMap, row.session_id, "session", tokens);
      }
    }

    const modelTotals = [...modelMap.values()].sort((a, b) => b.count - a.count);
    const topModel = modelTotals[0]
      ? {
          model: modelTotals[0].model,
          provider: modelTotals[0].provider,
          count: modelTotals[0].count,
        }
      : null;

    const dailyByModel = [...dailyMap.entries()]
      .map(([key, stats]) => {
        const [date, modelKey] = key.split("|");
        const [provider, ...modelParts] = (modelKey ?? "").split(":");
        return {
          date: date ?? "",
          provider: provider ?? "",
          model: modelParts.join(":"),
          count: stats.count,
          totalTokens: stats.totalTokens,
          estimatedCostUsd: stats.estimatedCostUsd,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.count - a.count);

    const dailySummaries = chartDays.map((day) => ({
      date: day.date,
      label: day.label,
      requests: day.total,
      totalTokens: day.totalTokens,
      estimatedCostUsd: day.estimatedCostUsd,
    }));

    const topUsers = [...userMap.values()]
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);
    const topSessions = [...sessionMap.values()]
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    const modelHealth = buildModelHealth(data);
    const hourTotal = hourRows.length;
    const hourErrors = hourRows.filter((row) => row.status !== "success").length;
    const errorRate = hourTotal > 0 ? hourErrors / hourTotal : 0;

    const alerts = buildAlerts({
      todayTokens,
      monthTokens,
      errorRate,
      modelHealth,
    });

    return {
      todayTotal,
      last7DaysTotal,
      monthTotal,
      todayTokens,
      last7DaysTokens,
      monthTokens,
      todayCostUsd,
      monthCostUsd,
      topModel,
      dailyByModel,
      chartDays,
      modelTotals,
      dailySummaries,
      topUsers,
      topSessions,
      modelHealth,
      alerts,
      recentActivity,
      platform: await getPlatformStats(),
    };
  } catch (error) {
    console.error("[IDA admin-stats]", error);
    return empty;
  }
}

export async function listRequestLogs(options?: {
  limit?: number;
}): Promise<RequestLogRow[]> {
  if (!isSupabaseConfigured()) return [];

  const limit = options?.limit ?? 100;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_request_logs")
      .select(
        "id, user_id, session_id, model, provider, route, prompt_tokens, completion_tokens, total_tokens, status, error_message, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as RequestLogRow[];
  } catch (error) {
    console.error("[IDA request-logs list]", error);
    return [];
  }
}