"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Coins,
  Cpu,
  FileText,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SimpleBarChart } from "@/components/admin/simple-bar-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { estimateRequestCost, formatCostUsd } from "@/lib/admin/pricing";
import type { AdminStats } from "@/lib/admin/types";
import { formatTokenCount } from "@/lib/admin/token-utils";
import { cn } from "@/lib/utils";

function statusColor(status: string): string {
  switch (status) {
    case "active":
    case "success":
      return "text-emerald-600 dark:text-emerald-400";
    case "degraded":
    case "preview":
      return "text-amber-600 dark:text-amber-400";
    case "down":
    case "error":
    case "rate_limit":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) throw new Error("Failed to load stats.");
        const data = (await response.json()) as { stats: AdminStats };
        if (!cancelled) setStats(data.stats);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const modelKeys = useMemo(() => {
    if (!stats) return [];
    return stats.modelTotals
      .slice(0, 5)
      .map((item) => `${item.provider}:${item.model}`);
  }, [stats]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading analytics...</p>;
  }

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground">
        Analytics unavailable. Ensure Supabase migrations 004–005 are applied.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {stats.alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <p className="font-medium">{alert.title}</p>
                <p className="text-muted-foreground">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Users className="size-5 text-muted-foreground" />
              {stats.platform.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.platform.activeUsersToday} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active users (7d)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Users className="size-5 text-muted-foreground" />
              {stats.platform.activeUsersWeek}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Logged in during the last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chat sessions</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <MessageSquare className="size-5 text-muted-foreground" />
              {stats.platform.totalChatSessions}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Worksheets</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <FileText className="size-5 text-muted-foreground" />
              {stats.platform.totalWorksheets}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Sessions with worksheet enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Research sessions</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Search className="size-5 text-muted-foreground" />
              {stats.platform.totalResearchSessions}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Requests today</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Activity className="size-5 text-muted-foreground" />
              {stats.todayTotal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.last7DaysTotal} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens today</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Zap className="size-5 text-muted-foreground" />
              {formatTokenCount(stats.todayTokens)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {formatTokenCount(stats.last7DaysTokens)} / 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Est. cost today</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Coins className="size-5 text-muted-foreground" />
              {formatCostUsd(stats.todayCostUsd)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {formatCostUsd(stats.monthCostUsd)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top model</CardDescription>
            <CardTitle className="text-lg">
              {stats.topModel ? (
                <span className="flex flex-col gap-1">
                  <span>{stats.topModel.model}</span>
                  <Badge variant="outline" className="w-fit">
                    {stats.topModel.provider} · {stats.topModel.count} req
                  </Badge>
                </span>
              ) : (
                "—"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Most used in 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Daily summary (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Day</th>
                  <th className="pb-2 pr-4 font-medium">Requests</th>
                  <th className="pb-2 pr-4 font-medium">Tokens</th>
                  <th className="pb-2 font-medium">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.dailySummaries.map((day) => (
                  <tr key={day.date} className="border-b border-border/50">
                    <td className="py-2 pr-4">{day.label}</td>
                    <td className="py-2 pr-4">{day.requests}</td>
                    <td className="py-2 pr-4">
                      {formatTokenCount(day.totalTokens)}
                    </td>
                    <td className="py-2">{formatCostUsd(day.estimatedCostUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Requests per model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              days={stats.chartDays}
              modelKeys={modelKeys}
              metric="requests"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4" />
              Tokens per model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              days={stats.chartDays}
              modelKeys={modelKeys}
              metric="tokens"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model usage & cost</CardTitle>
            <CardDescription>Token breakdown and estimated USD cost</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.modelTotals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.modelTotals.map((item) => (
                  <div
                    key={`${item.provider}:${item.model}`}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.model}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.provider}
                        </p>
                      </div>
                      <Badge>{item.count} req</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {formatTokenCount(item.totalTokens)} tokens
                      </span>
                      <span>
                        in {formatTokenCount(item.promptTokens)} / out{" "}
                        {formatTokenCount(item.completionTokens)}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCostUsd(item.estimatedCostUsd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="size-4" />
              Model status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.modelHealth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No model activity yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.modelHealth.slice(0, 8).map((item) => (
                  <div
                    key={`${item.provider}:${item.model}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.provider} · {(item.successRate * 100).toFixed(0)}%
                        success
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        statusColor(item.status),
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Active users
          </CardTitle>
          <CardDescription>
            Recently signed-in users (refreshes every 60s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.platform.activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active users yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {stats.platform.activeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {user.fullName ?? user.email ?? user.id.slice(0, 8)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email ?? user.id}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top users</CardTitle>
            <CardDescription>By request count (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No user data.</p>
            ) : (
              <div className="space-y-2">
                {stats.topUsers.map((actor, index) => (
                  <div
                    key={actor.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate font-mono text-xs">
                      #{index + 1} {actor.id.slice(0, 18)}…
                    </span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{actor.requests} req</Badge>
                      <Badge>{formatTokenCount(actor.totalTokens)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top sessions</CardTitle>
            <CardDescription>By request count (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No session data.</p>
            ) : (
              <div className="space-y-2">
                {stats.topSessions.map((actor, index) => (
                  <div
                    key={actor.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate font-mono text-xs">
                      #{index + 1} {actor.id.slice(0, 18)}…
                    </span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{actor.requests} req</Badge>
                      <Badge>{formatTokenCount(actor.totalTokens)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Last 20 requests</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent requests.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        statusColor(log.status),
                      )}
                    >
                      {log.status}
                    </span>
                    <Badge variant="outline">{log.provider}</Badge>
                    <span className="font-medium">{log.model}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTokenCount(log.total_tokens)} tokens ·{" "}
                    {formatCostUsd(
                      estimateRequestCost({
                        provider: log.provider,
                        model: log.model,
                        usage: {
                          promptTokens: log.prompt_tokens,
                          completionTokens: log.completion_tokens,
                          totalTokens: log.total_tokens,
                        },
                      }),
                    )}{" "}
                    est.
                    {log.error_message ? ` · ${log.error_message}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}