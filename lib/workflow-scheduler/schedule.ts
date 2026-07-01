import type { WorkflowNode } from "@/lib/workflow";

import type { WorkflowScheduleConfig, WorkflowScheduleType } from "./types";

export const MAX_INLINE_DELAY_MS = 30_000;
export const MAX_SCHEDULED_DELAY_MS = 86_400_000;

const CRON_TYPES: WorkflowScheduleType[] = [
  "daily",
  "weekly",
  "monthly",
];

const EVENT_TYPES: WorkflowScheduleType[] = [
  "event_email",
  "event_webhook",
  "event_calendar",
];

export function isCronScheduleType(type: WorkflowScheduleType): boolean {
  return CRON_TYPES.includes(type);
}

export function isEventScheduleType(type: WorkflowScheduleType): boolean {
  return EVENT_TYPES.includes(type);
}

export function isPersistedScheduleType(type: WorkflowScheduleType): boolean {
  return type !== "immediate";
}

function normalizeScheduleType(raw: unknown): WorkflowScheduleType {
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
  return allowed.includes(raw as WorkflowScheduleType)
    ? (raw as WorkflowScheduleType)
    : "immediate";
}

export function parseTriggerSchedule(node: WorkflowNode): WorkflowScheduleConfig {
  const raw = node.data.config?.schedule;
  if (!raw || typeof raw !== "object") {
    return { type: "immediate" };
  }

  const schedule = raw as Partial<WorkflowScheduleConfig>;
  const type = normalizeScheduleType(schedule.type);

  return {
    type,
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
      typeof schedule.eventFilter === "string" && schedule.eventFilter.trim()
        ? schedule.eventFilter.trim()
        : undefined,
    enabled: schedule.enabled !== false,
  };
}

export function buildCronExpression(
  schedule: WorkflowScheduleConfig,
): string | null {
  const minute = 0;
  const hour = schedule.hour ?? 9;

  if (schedule.type === "daily") {
    return `${minute} ${hour} * * *`;
  }
  if (schedule.type === "weekly") {
    return `${minute} ${hour} * * ${schedule.dayOfWeek ?? 1}`;
  }
  if (schedule.type === "monthly") {
    return `${minute} ${hour} ${schedule.dayOfMonth ?? 1} * *`;
  }
  return null;
}

export function computeNextRunAt(
  schedule: WorkflowScheduleConfig,
  from = Date.now(),
): number | null {
  if (schedule.type === "immediate") return from;
  if (isEventScheduleType(schedule.type)) return null;

  if (schedule.type === "delay") {
    return from + (schedule.delayMs ?? 0);
  }

  const next = new Date(from);
  const hour = schedule.hour ?? 9;
  next.setHours(hour, 0, 0, 0);

  if (schedule.type === "daily") {
    if (next.getTime() <= from) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  }

  if (schedule.type === "weekly") {
    const targetDay = schedule.dayOfWeek ?? 1;
    const currentDay = next.getDay();
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next.getTime() <= from) {
      daysUntil = 7;
    }
    next.setDate(next.getDate() + daysUntil);
    return next.getTime();
  }

  if (schedule.type === "monthly") {
    const dayOfMonth = schedule.dayOfMonth ?? 1;
    next.setDate(dayOfMonth);
    next.setHours(hour, 0, 0, 0);
    if (next.getTime() <= from) {
      next.setMonth(next.getMonth() + 1);
      const daysInMonth = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(dayOfMonth, daysInMonth));
      next.setHours(hour, 0, 0, 0);
    }
    return next.getTime();
  }

  return null;
}

export function formatScheduleLabel(
  schedule: WorkflowScheduleConfig,
  locale: "id" | "en" | "zh" = "en",
): string {
  if (schedule.type === "immediate") {
    return locale === "id"
      ? "Segera"
      : locale === "zh"
        ? "立即"
        : "Immediately";
  }
  if (schedule.type === "delay") {
    const sec = Math.round((schedule.delayMs ?? 0) / 1000);
    return locale === "id"
      ? `Tunda ${sec} detik`
      : locale === "zh"
        ? `延迟 ${sec} 秒`
        : `Delay ${sec}s`;
  }
  if (schedule.type === "daily") {
    const h = schedule.hour ?? 9;
    return locale === "id"
      ? `Harian jam ${h}:00`
      : locale === "zh"
        ? `每天 ${h}:00`
        : `Daily at ${h}:00`;
  }
  if (schedule.type === "weekly") {
    const days =
      locale === "id"
        ? ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
        : locale === "zh"
          ? ["日", "一", "二", "三", "四", "五", "六"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const h = schedule.hour ?? 9;
    const d = days[schedule.dayOfWeek ?? 1] ?? days[1];
    return locale === "id"
      ? `Mingguan ${d} jam ${h}:00`
      : locale === "zh"
        ? `每周${d} ${h}:00`
        : `Weekly ${d} ${h}:00`;
  }
  if (schedule.type === "monthly") {
    const h = schedule.hour ?? 9;
    const dom = schedule.dayOfMonth ?? 1;
    return locale === "id"
      ? `Bulanan tanggal ${dom} jam ${h}:00`
      : locale === "zh"
        ? `每月 ${dom} 日 ${h}:00`
        : `Monthly on day ${dom} at ${h}:00`;
  }
  if (schedule.type === "event_email") {
    const filter = schedule.eventFilter?.trim();
    return locale === "id"
      ? filter
        ? `Email baru: ${filter}`
        : "Email baru"
      : locale === "zh"
        ? filter
          ? `新邮件：${filter}`
          : "新邮件"
        : filter
          ? `New email: ${filter}`
          : "New email";
  }
  if (schedule.type === "event_webhook") {
    return locale === "id"
      ? "Webhook"
      : locale === "zh"
        ? "Webhook"
        : "Webhook";
  }
  if (schedule.type === "event_calendar") {
    const filter = schedule.eventFilter?.trim();
    return locale === "id"
      ? filter
        ? `Kalender: ${filter}`
        : "Event kalender"
      : locale === "zh"
        ? filter
          ? `日历：${filter}`
          : "日历事件"
        : filter
          ? `Calendar: ${filter}`
          : "Calendar event";
  }
  return schedule.type;
}

export function getServerDelayMs(schedule: WorkflowScheduleConfig): number {
  if (schedule.type !== "delay" || !schedule.delayMs) return 0;
  return Math.min(schedule.delayMs, MAX_INLINE_DELAY_MS);
}