"use client";

import { ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

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

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
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
          Recent chat API requests with model and user attribution.
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
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{log.route}</Badge>
                    <Badge>{log.provider}</Badge>
                    <span className="font-medium">{log.model}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    user: {log.user_id ?? "—"} · session: {log.session_id ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}