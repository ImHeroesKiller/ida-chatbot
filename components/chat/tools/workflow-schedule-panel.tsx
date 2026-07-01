"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  formatScheduleLabel,
  MAX_SCHEDULED_DELAY_MS,
  type WorkflowScheduleConfig,
  type WorkflowScheduleType,
} from "@/lib/workflow-scheduler";
import type { WorkflowDefinition, WorkflowNode } from "@/lib/workflow";

const WEEKDAY_OPTIONS = [
  { value: 0, id: "Min", en: "Sun", zh: "日" },
  { value: 1, id: "Sen", en: "Mon", zh: "一" },
  { value: 2, id: "Sel", en: "Tue", zh: "二" },
  { value: 3, id: "Rab", en: "Wed", zh: "三" },
  { value: 4, id: "Kam", en: "Thu", zh: "四" },
  { value: 5, id: "Jum", en: "Fri", zh: "五" },
  { value: 6, id: "Sab", en: "Sat", zh: "六" },
] as const;

function readTriggerSchedule(node: WorkflowNode): WorkflowScheduleConfig {
  const raw = node.data.config?.schedule;
  if (!raw || typeof raw !== "object") {
    return { type: "immediate", enabled: true };
  }

  const schedule = raw as Partial<WorkflowScheduleConfig>;
  const allowed: WorkflowScheduleType[] = [
    "immediate",
    "delay",
    "daily",
    "weekly",
    "monthly",
    "event_email",
    "event_webhook",
    "event_calendar",
  ];

  return {
    type: allowed.includes(schedule.type as WorkflowScheduleType)
      ? (schedule.type as WorkflowScheduleType)
      : "immediate",
    delayMs:
      typeof schedule.delayMs === "number" && schedule.delayMs > 0
        ? Math.min(schedule.delayMs, MAX_SCHEDULED_DELAY_MS)
        : undefined,
    hour:
      typeof schedule.hour === "number"
        ? Math.min(23, Math.max(0, schedule.hour))
        : 9,
    dayOfWeek:
      typeof schedule.dayOfWeek === "number"
        ? Math.min(6, Math.max(0, schedule.dayOfWeek))
        : 1,
    dayOfMonth:
      typeof schedule.dayOfMonth === "number"
        ? Math.min(31, Math.max(1, schedule.dayOfMonth))
        : 1,
    eventFilter:
      typeof schedule.eventFilter === "string"
        ? schedule.eventFilter
        : undefined,
    enabled: schedule.enabled !== false,
  };
}

interface WorkflowSchedulePanelProps {
  locale: Locale;
  workflow: WorkflowDefinition;
  triggerNode: WorkflowNode;
  sessionId?: string;
  onScheduleChange: (schedule: WorkflowScheduleConfig) => void;
}

export function WorkflowSchedulePanel({
  locale,
  workflow,
  triggerNode,
  sessionId,
  onScheduleChange,
}: WorkflowSchedulePanelProps) {
  const copy = COPY[locale];
  const schedule = readTriggerSchedule(triggerNode);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  const updateSchedule = useCallback(
    (patch: Partial<WorkflowScheduleConfig>) => {
      onScheduleChange({ ...schedule, ...patch });
    },
    [onScheduleChange, schedule],
  );

  useEffect(() => {
    setWebhookUrl(null);
  }, [triggerNode.id, schedule.type]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/workflow/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          triggerNodeId: triggerNode.id,
          schedule,
          workflow,
          sessionId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to save schedule.");
      }

      const data = (await response.json()) as {
        label?: string;
        webhookUrl?: string | null;
      };

      if (data.webhookUrl) {
        setWebhookUrl(data.webhookUrl);
      }

      toast.success(
        copy.workflowScheduleSaved.replace(
          "{label}",
          data.label ?? formatScheduleLabel(schedule, locale),
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : copy.workflowScheduleSaveFailed,
      );
    } finally {
      setSaving(false);
    }
  }, [
    copy.workflowScheduleSaveFailed,
    copy.workflowScheduleSaved,
    locale,
    schedule,
    sessionId,
    triggerNode.id,
    workflow,
  ]);

  const showTimeFields =
    schedule.type === "daily" ||
    schedule.type === "weekly" ||
    schedule.type === "monthly";
  const showEventFilter =
    schedule.type === "event_email" || schedule.type === "event_calendar";

  return (
    <div className="space-y-2 rounded-md border border-dashed p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <CalendarClock className="h-3 w-3" />
        {copy.workflowScheduleTitle}
      </div>

      <div className="space-y-1">
        <Label htmlFor="workflow-schedule-type" className="text-xs">
          {copy.workflowScheduleType}
        </Label>
        <select
          id="workflow-schedule-type"
          value={schedule.type}
          onChange={(event) =>
            updateSchedule({
              type: event.target.value as WorkflowScheduleType,
            })
          }
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="immediate">{copy.workflowScheduleImmediate}</option>
          <option value="delay">{copy.workflowScheduleDelay}</option>
          <option value="daily">{copy.workflowScheduleDaily}</option>
          <option value="weekly">{copy.workflowScheduleWeekly}</option>
          <option value="monthly">{copy.workflowScheduleMonthly}</option>
          <option value="event_email">{copy.workflowScheduleEventEmail}</option>
          <option value="event_webhook">
            {copy.workflowScheduleEventWebhook}
          </option>
          <option value="event_calendar">
            {copy.workflowScheduleEventCalendar}
          </option>
        </select>
      </div>

      {schedule.type === "delay" ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-schedule-delay" className="text-xs">
            {copy.workflowScheduleDelayMs}
          </Label>
          <Input
            id="workflow-schedule-delay"
            type="number"
            min={1}
            max={86400}
            value={Math.round((schedule.delayMs ?? 5000) / 1000)}
            onChange={(event) =>
              updateSchedule({
                delayMs:
                  Math.min(
                    86_400,
                    Math.max(1, Number(event.target.value) || 1),
                  ) * 1000,
              })
            }
            className="h-8 text-xs"
          />
        </div>
      ) : null}

      {showTimeFields ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-schedule-hour" className="text-xs">
            {copy.workflowScheduleHour}
          </Label>
          <Input
            id="workflow-schedule-hour"
            type="number"
            min={0}
            max={23}
            value={schedule.hour ?? 9}
            onChange={(event) =>
              updateSchedule({
                hour: Math.min(23, Math.max(0, Number(event.target.value) || 0)),
              })
            }
            className="h-8 text-xs"
          />
        </div>
      ) : null}

      {schedule.type === "weekly" ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-schedule-dow" className="text-xs">
            {copy.workflowScheduleDayOfWeek}
          </Label>
          <select
            id="workflow-schedule-dow"
            value={schedule.dayOfWeek ?? 1}
            onChange={(event) =>
              updateSchedule({ dayOfWeek: Number(event.target.value) })
            }
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            {WEEKDAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {locale === "id" ? day.id : locale === "zh" ? day.zh : day.en}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {schedule.type === "monthly" ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-schedule-dom" className="text-xs">
            {copy.workflowScheduleDayOfMonth}
          </Label>
          <Input
            id="workflow-schedule-dom"
            type="number"
            min={1}
            max={31}
            value={schedule.dayOfMonth ?? 1}
            onChange={(event) =>
              updateSchedule({
                dayOfMonth: Math.min(
                  31,
                  Math.max(1, Number(event.target.value) || 1),
                ),
              })
            }
            className="h-8 text-xs"
          />
        </div>
      ) : null}

      {showEventFilter ? (
        <div className="space-y-1">
          <Label htmlFor="workflow-schedule-event-filter" className="text-xs">
            {copy.workflowScheduleEventFilter}
          </Label>
          <Input
            id="workflow-schedule-event-filter"
            value={schedule.eventFilter ?? ""}
            onChange={(event) =>
              updateSchedule({ eventFilter: event.target.value })
            }
            placeholder={copy.workflowScheduleEventFilterPlaceholder}
            className="h-8 text-xs"
          />
        </div>
      ) : null}

      {schedule.type === "event_webhook" && webhookUrl ? (
        <p className="break-all text-[10px] text-muted-foreground">
          {copy.workflowScheduleWebhookUrl}: {webhookUrl}
        </p>
      ) : null}

      <p className="text-[10px] text-muted-foreground">
        {formatScheduleLabel(schedule, locale)}
      </p>

      {schedule.type !== "immediate" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-full text-xs"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : null}
          {copy.workflowScheduleSave}
        </Button>
      ) : null}
    </div>
  );
}