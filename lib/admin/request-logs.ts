import type { AdminStats, RequestLogRow } from "@/lib/admin/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export interface LogRequestInput {
  userId?: string | null;
  sessionId?: string | null;
  model: string;
  provider: string;
  route?: string;
}

export async function logRequest(input: LogRequestInput): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("ida_request_logs").insert({
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      model: input.model,
      provider: input.provider,
      route: input.route ?? "chat",
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
      total: 0,
    });
  }

  return days;
}

export async function getAdminStats(): Promise<AdminStats> {
  const empty: AdminStats = {
    todayTotal: 0,
    last7DaysTotal: 0,
    topModel: null,
    dailyByModel: [],
    chartDays: buildEmptyChartDays(),
    modelTotals: [],
  };

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = getSupabaseAdmin();
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 6);
    since.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("ida_request_logs")
      .select("model, provider, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (error || !data?.length) {
      return empty;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const chartDays = buildEmptyChartDays();
    const chartIndex = new Map(chartDays.map((day, index) => [day.date, index]));
    const dailyMap = new Map<string, number>();
    const modelMap = new Map<string, { model: string; provider: string; count: number }>();

    let todayTotal = 0;
    let last7DaysTotal = 0;

    for (const row of data) {
      const createdAt = row.created_at as string;
      const date = createdAt.slice(0, 10);
      const model = row.model as string;
      const provider = row.provider as string;
      const modelKey = `${provider}:${model}`;

      last7DaysTotal += 1;
      if (date === todayIso) todayTotal += 1;

      const dailyKey = `${date}|${modelKey}`;
      dailyMap.set(dailyKey, (dailyMap.get(dailyKey) ?? 0) + 1);

      const existing = modelMap.get(modelKey);
      if (existing) {
        existing.count += 1;
      } else {
        modelMap.set(modelKey, { model, provider, count: 1 });
      }

      const dayIndex = chartIndex.get(date);
      if (dayIndex !== undefined) {
        const day = chartDays[dayIndex]!;
        day.byModel[modelKey] = (day.byModel[modelKey] ?? 0) + 1;
        day.total += 1;
      }
    }

    const modelTotals = [...modelMap.values()].sort((a, b) => b.count - a.count);
    const topModel = modelTotals[0] ?? null;

    const dailyByModel = [...dailyMap.entries()]
      .map(([key, count]) => {
        const [date, modelKey] = key.split("|");
        const [provider, ...modelParts] = (modelKey ?? "").split(":");
        return {
          date: date ?? "",
          provider: provider ?? "",
          model: modelParts.join(":"),
          count,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.count - a.count);

    return {
      todayTotal,
      last7DaysTotal,
      topModel,
      dailyByModel,
      chartDays,
      modelTotals,
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
      .select("id, user_id, session_id, model, provider, route, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as RequestLogRow[];
  } catch (error) {
    console.error("[IDA request-logs list]", error);
    return [];
  }
}