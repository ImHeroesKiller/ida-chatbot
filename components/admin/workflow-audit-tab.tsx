"use client";

import { ShieldCheck } from "lucide-react";
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
import type { WorkflowAuditEntry } from "@/lib/workflow-security";
import { cn } from "@/lib/utils";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function actionClass(action: string): string {
  if (action.includes("failed") || action.includes("rejected")) {
    return "text-destructive";
  }
  if (action.includes("approval")) return "text-amber-700 dark:text-amber-300";
  if (action.includes("completed") || action.includes("granted")) {
    return "text-emerald-700 dark:text-emerald-300";
  }
  return "text-foreground";
}

export function WorkflowAuditTab() {
  const [logs, setLogs] = useState<WorkflowAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/workflow-audit?limit=200");
        if (!response.ok) throw new Error("Failed to load workflow audit logs.");
        const data = (await response.json()) as { logs: WorkflowAuditEntry[] };
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
          <ShieldCheck className="size-4" />
          Workflow Audit Log
        </CardTitle>
        <CardDescription>
          Changes and executions recorded in{" "}
          <code className="text-xs">ida_workflow_audit_logs</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading audit entries…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workflow audit entries yet. Run migrations 020+ and execute a
            workflow to populate logs.
          </p>
        ) : (
          <ScrollArea className="h-[28rem] pr-3">
            <ul className="space-y-2">
              {logs.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn("font-medium", actionClass(entry.action))}
                    >
                      {entry.action}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {entry.actorType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.workflowName ?? entry.workflowId ?? "—"}
                    {entry.userId ? ` · user ${entry.userId.slice(0, 8)}…` : ""}
                    {entry.sessionId
                      ? ` · session ${entry.sessionId.slice(0, 8)}…`
                      : ""}
                  </p>
                  {Object.keys(entry.details).length > 0 ? (
                    <pre className="mt-1 max-h-20 overflow-auto text-[10px] text-muted-foreground">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}