"use client";

import { CalendarClock, Power, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatScheduleLabel } from "@/lib/workflow-scheduler";
import type {
  WorkflowScheduleRecord,
  WorkflowTriggerEventRecord,
} from "@/lib/workflow-scheduler";
import { cn } from "@/lib/utils";

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusClass(status: string): string {
  if (status === "failed") return "text-destructive";
  if (status === "dispatched") return "text-emerald-700 dark:text-emerald-300";
  if (status === "skipped") return "text-muted-foreground";
  return "text-amber-700 dark:text-amber-300";
}

export function WorkflowTriggersTab() {
  const [schedules, setSchedules] = useState<WorkflowScheduleRecord[]>([]);
  const [events, setEvents] = useState<WorkflowTriggerEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/workflow-triggers?limit=200");
      if (!response.ok) throw new Error("Failed to load triggers.");
      const data = (await response.json()) as {
        schedules: WorkflowScheduleRecord[];
        events: WorkflowTriggerEventRecord[];
      };
      setSchedules(data.schedules);
      setEvents(data.events);
    } catch {
      setSchedules([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    setTogglingId(scheduleId);
    try {
      const response = await fetch("/api/admin/workflow-triggers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, enabled }),
      });
      if (!response.ok) throw new Error("Update failed.");
      setSchedules((prev) =>
        prev.map((entry) =>
          entry.id === scheduleId ? { ...entry, enabled } : entry,
        ),
      );
      toast.success(enabled ? "Trigger enabled." : "Trigger disabled.");
    } catch {
      toast.error("Could not update trigger.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              Workflow Triggers
            </CardTitle>
            <CardDescription>
              Registered schedules from{" "}
              <code className="text-xs">ida_workflow_schedules</code>. Cron
              ticks call{" "}
              <code className="text-xs">/api/workflow/scheduler/tick</code>{" "}
              (set <code className="text-xs">WORKFLOW_SCHEDULER_SECRET</code>).
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading triggers…</p>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No registered triggers yet. Save a schedule from the workflow
              panel (migration 021 required).
            </p>
          ) : (
            <ScrollArea className="h-[20rem] pr-3">
              <ul className="space-y-2">
                {schedules.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {entry.workflowName ?? entry.workflowId}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {entry.scheduleType}
                      </Badge>
                      <Badge
                        variant={entry.enabled ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {entry.enabled ? "enabled" : "disabled"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatScheduleLabel(entry.scheduleConfig, "en")}
                      {" · "}next {formatTimestamp(entry.nextRunAt)}
                      {" · "}runs {entry.runCount}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={togglingId === entry.id}
                        onClick={() =>
                          void toggleSchedule(entry.id, !entry.enabled)
                        }
                      >
                        <Power className="mr-1 size-3" />
                        {entry.enabled ? "Disable" : "Enable"}
                      </Button>
                      {entry.webhookToken ? (
                        <code className="text-[10px] text-muted-foreground">
                          webhook …{entry.webhookToken.slice(-8)}
                        </code>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent trigger events</CardTitle>
          <CardDescription>
            Dispatch log from{" "}
            <code className="text-xs">ida_workflow_trigger_events</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trigger events yet.</p>
          ) : (
            <ScrollArea className="h-[16rem] pr-3">
              <ul className="space-y-2">
                {events.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border bg-muted/10 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("font-medium", statusClass(entry.status))}>
                        {entry.eventType}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.workflowId ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}