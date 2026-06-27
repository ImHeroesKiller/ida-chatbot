"use client";

import { ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

import { estimateRequestCost, formatCostUsd } from "@/lib/admin/pricing";
import { formatTokenCount } from "@/lib/admin/token-utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RequestLogRow } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function statusClass(status: string): string {
  if (status === "success") return "text-emerald-600";
  if (status === "rate_limit") return "text-amber-600";
  return "text-red-600";
}

export function LogsTab() {
  const [logs, setLogs] = useState<RequestLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/logs?limit=200");
        if (!response.ok) throw new Error("Failed to load logs.");
        const data = (await response.json()) as { logs: RequestLogRow[] };
        if (!cancelled) setLogs(data.logs);
      } catch {
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="size-4" />
          Request logs
        </CardTitle>
        <CardDescription>
          Chat API requests with tokens, cost estimate, and status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logs recorded yet.</p>
        ) : (
          <ScrollArea className="h-[min(60vh,520px)]">
            <div className="space-y-2 pr-3">
              {logs.map((log) => {
                const cost = estimateRequestCost({
                  provider: log.provider,
                  model: log.model,
                  usage: {
                    promptTokens: log.prompt_tokens,
                    completionTokens: log.completion_tokens,
                    totalTokens: log.total_tokens,
                  },
                });

                return (
                  <div
                    key={log.id}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium capitalize",
                          statusClass(log.status),
                        )}
                      >
                        {log.status}
                      </span>
                      <Badge variant="outline">{log.route}</Badge>
                      <Badge>{log.provider}</Badge>
                      <span className="font-medium">{log.model}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTokenCount(log.total_tokens)} tokens (in{" "}
                      {log.prompt_tokens} / out {log.completion_tokens}) ·{" "}
                      {formatCostUsd(cost)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      user: {log.user_id ?? "—"} · session:{" "}
                      {log.session_id ?? "—"}
                    </p>
                    {log.error_message && (
                      <p className="mt-1 text-xs text-red-600">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}