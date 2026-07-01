"use client";

import {
  Activity,
  Bot,
  Clock,
  GitBranch,
  LineChart as LineChartIcon,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkflowAnalytics } from "@/lib/admin/types";
import { fadeUp, staggerItem } from "@/lib/ui/motion-presets";
import { cn } from "@/lib/utils";

const ANALYTICS_CARD_CLASS =
  "border-border/40 shadow-sm backdrop-blur-sm lg:ida-glass-subtle ida-hover-lift transition-shadow duration-300";

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "failed":
      return "bg-destructive/15 text-destructive";
    case "running":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-200";
    case "awaiting_approval":
    case "paused":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-100";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function WorkflowAnalyticsDashboard({
  showBackLink = true,
}: {
  showBackLink?: boolean;
}) {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/analytics");
        if (!response.ok) throw new Error("Failed to load workflow analytics.");
        const data = (await response.json()) as { analytics: WorkflowAnalytics };
        if (!cancelled) setAnalytics(data.analytics);
      } catch {
        if (!cancelled) setAnalytics(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <motion.div
        {...fadeUp}
        className="space-y-4"
        aria-busy="true"
        aria-label="Loading workflow analytics"
      >
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-border/30 bg-muted/30"
              style={{ animationDelay: `${index * 80}ms` }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!analytics) {
    return (
      <motion.p
        {...fadeUp}
        className="rounded-2xl border border-dashed border-border/50 px-4 py-6 text-center text-sm text-muted-foreground lg:ida-glass-subtle"
      >
        Workflow analytics unavailable. Ensure Supabase is configured and
        migrations 018+ are applied.
      </motion.p>
    );
  }

  const { overview } = analytics;

  return (
    <motion.div {...fadeUp} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Workflow Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated from chat session workflows, execution logs, and request
            logs (last 30 days).
          </p>
        </div>
        {showBackLink ? (
          <Link
            href="/admin"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ← Back to Admin
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: GitBranch,
            label: "Total workflows",
            value: overview.totalWorkflows,
            detail: `${overview.workflowEnabledSessions} sessions with workflow canvas`,
          },
          {
            icon: Activity,
            label: "Success rate",
            value: formatPercent(overview.successRate),
            detail: `${overview.totalExecutions} recorded executions`,
          },
          {
            icon: Clock,
            label: "Avg execution time",
            value: formatDuration(overview.avgExecutionTimeMs),
            detail: `API requests (7d): ${analytics.workflowRequestLogs.last7Days}`,
          },
          {
            icon: Users,
            label: "Active users",
            value: overview.activeUsers,
            detail: `${overview.activeUsersWeek} active this week`,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} {...staggerItem(index)}>
              <Card className={cn("rounded-2xl", ANALYTICS_CARD_CLASS)}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Icon className="size-3.5" />
                    {stat.label}
                  </CardDescription>
                  <CardTitle className="text-2xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {stat.detail}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn("rounded-2xl", ANALYTICS_CARD_CLASS)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChartIcon className="size-4" />
              Executions (7 days)
            </CardTitle>
            <CardDescription>Daily workflow runs from session snapshots</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyExecutions}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="executions"
                  name="Total"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="var(--chart-5)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={cn("rounded-2xl", ANALYTICS_CARD_CLASS)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4" />
              Agent performance
            </CardTitle>
            <CardDescription>
              Multi-agent step invocations from execution logs
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {analytics.agentPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agent activity recorded yet. Run a workflow with multi-agent
                steps.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [value, String(name)]}
                    labelFormatter={(label) => `Agent: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="failed"
                    name="Failed"
                    fill="var(--chart-5)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={cn("rounded-2xl", ANALYTICS_CARD_CLASS)}>
        <CardHeader>
          <CardTitle className="text-base">Per-workflow stats</CardTitle>
          <CardDescription>
            Definitions and last-known execution outcomes by workflow name
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Workflow</th>
                <th className="pb-2 pr-3 font-medium">Definitions</th>
                <th className="pb-2 pr-3 font-medium">Executions</th>
                <th className="pb-2 pr-3 font-medium">Success</th>
                <th className="pb-2 pr-3 font-medium">Failed</th>
                <th className="pb-2 pr-3 font-medium">Avg time</th>
                <th className="pb-2 font-medium">Last run</th>
              </tr>
            </thead>
            <tbody>
              {analytics.perWorkflow.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No workflow definitions found in chat sessions.
                  </td>
                </tr>
              ) : (
                analytics.perWorkflow.map((row) => (
                  <tr key={row.workflowName} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium">{row.workflowName}</td>
                    <td className="py-2 pr-3">{row.definitionCount}</td>
                    <td className="py-2 pr-3">{row.executionCount}</td>
                    <td className="py-2 pr-3 text-emerald-700 dark:text-emerald-300">
                      {row.successCount}
                    </td>
                    <td className="py-2 pr-3 text-destructive">{row.failedCount}</td>
                    <td className="py-2 pr-3">
                      {formatDuration(row.avgDurationMs)}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {row.lastExecutedAt
                        ? new Date(row.lastExecutedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className={cn("rounded-2xl", ANALYTICS_CARD_CLASS)}>
        <CardHeader>
          <CardTitle className="text-base">Execution logs summary</CardTitle>
          <CardDescription>
            Latest workflow runs from{" "}
            <code className="text-xs">ida_chat_sessions.workflow</code> — request
            logs: {analytics.workflowRequestLogs.success} ok /{" "}
            {analytics.workflowRequestLogs.errors} errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {analytics.executionLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No execution snapshots persisted yet.
            </p>
          ) : (
            analytics.executionLogs.map((log, index) => (
              <motion.div
                key={log.id}
                {...staggerItem(index)}
                className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-sm backdrop-blur-sm transition-colors duration-200 hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{log.workflowName}</span>
                  <Badge
                    variant="secondary"
                    className={cn("capitalize", statusBadgeClass(log.status))}
                  >
                    {log.status}
                  </Badge>
                  {log.durationMs ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(log.durationMs)}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.startedAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Session {log.sessionId.slice(0, 12)}… · {log.nodeCount} log
                  entries
                  {log.agentIds.length > 0
                    ? ` · agents: ${log.agentIds.join(", ")}`
                    : ""}
                </p>
                {log.message ? (
                  <p className="mt-1 line-clamp-2 text-xs">{log.message}</p>
                ) : null}
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Generated {new Date(analytics.generatedAt).toLocaleString()}
      </p>
    </motion.div>
  );
}