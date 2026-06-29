import type { ActiveUserRow, PlatformStats } from "@/lib/admin/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

function startOfTodayIso(): string {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return start.toISOString();
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const empty: PlatformStats = {
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersWeek: 0,
    totalChatSessions: 0,
    totalWorksheets: 0,
    totalResearchSessions: 0,
    activeUsers: [],
  };

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = getSupabaseAdmin();
    const todayStart = startOfTodayIso();
    const weekStart = daysAgoIso(7);

    const [
      usersResult,
      activeTodayResult,
      activeWeekResult,
      sessionsResult,
      worksheetsResult,
      researchResult,
      recentUsersResult,
    ] = await Promise.all([
      supabase.from("ida_users").select("id", { count: "exact", head: true }),
      supabase
        .from("ida_users")
        .select("id", { count: "exact", head: true })
        .gte("last_login_at", todayStart),
      supabase
        .from("ida_users")
        .select("id", { count: "exact", head: true })
        .gte("last_login_at", weekStart),
      supabase
        .from("ida_chat_sessions")
        .select("chat_id", { count: "exact", head: true }),
      supabase
        .from("ida_chat_sessions")
        .select("chat_id", { count: "exact", head: true })
        .or("worksheet_tool_enabled.eq.true,worksheet.not.is.null"),
      supabase
        .from("ida_chat_sessions")
        .select("chat_id", { count: "exact", head: true })
        .eq("research_enabled", true),
      supabase
        .from("ida_users")
        .select("id, email, full_name, avatar_url, last_login_at")
        .not("last_login_at", "is", null)
        .order("last_login_at", { ascending: false })
        .limit(12),
    ]);

    const activeUsers: ActiveUserRow[] = (recentUsersResult.data ?? []).map(
      (row) => ({
        id: row.id as string,
        email: (row.email as string | null) ?? null,
        fullName: (row.full_name as string | null) ?? null,
        avatarUrl: (row.avatar_url as string | null) ?? null,
        lastLoginAt: (row.last_login_at as string | null) ?? null,
      }),
    );

    return {
      totalUsers: usersResult.count ?? 0,
      activeUsersToday: activeTodayResult.count ?? 0,
      activeUsersWeek: activeWeekResult.count ?? 0,
      totalChatSessions: sessionsResult.count ?? 0,
      totalWorksheets: worksheetsResult.count ?? 0,
      totalResearchSessions: researchResult.count ?? 0,
      activeUsers,
    };
  } catch (error) {
    console.error("[IDA platform-stats]", error);
    return empty;
  }
}