"use client";

import { Activity, BarChart3, TrendingUp } from "lucide-react";
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
import type { AdminStats } from "@/lib/admin/types";

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
    return () => {
      cancelled = true;
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
        Analytics unavailable. Ensure Supabase migration 004 is applied.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Activity className="size-5 text-muted-foreground" />
              {stats.todayTotal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Chat requests today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 days</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <TrendingUp className="size-5 text-muted-foreground" />
              {stats.last7DaysTotal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total chat requests</p>
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
            <BarChart3 className="size-4" />
            Requests per model (7 days)
          </CardTitle>
          <CardDescription>
            Daily chat volume stacked by model provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart days={stats.chartDays} modelKeys={modelKeys} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model usage</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.modelTotals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests logged yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.modelTotals.map((item) => (
                <div
                  key={`${item.provider}:${item.model}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.model}</p>
                    <p className="text-xs text-muted-foreground">{item.provider}</p>
                  </div>
                  <Badge>{item.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}