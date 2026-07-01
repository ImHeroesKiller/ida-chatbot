import type { WorkflowNode } from "@/lib/workflow";

export type WorkflowScheduleType = "immediate" | "delay" | "daily" | "weekly";

export interface WorkflowScheduleConfig {
  type: WorkflowScheduleType;
  /** Delay in milliseconds (delay type). Capped server-side for stub runs. */
  delayMs?: number;
  /** Hour of day 0-23 (daily/weekly). */
  hour?: number;
  /** Day of week 0=Sunday (weekly). */
  dayOfWeek?: number;
}

export interface WorkflowScheduledRun {
  workflowId: string;
  triggerNodeId: string;
  schedule: WorkflowScheduleConfig;
  nextRunAt: number;
  registeredAt: number;
}

const MAX_SERVER_DELAY_MS = 30_000;

export function parseTriggerSchedule(node: WorkflowNode): WorkflowScheduleConfig {
  const raw = node.data.config?.schedule;
  if (!raw || typeof raw !== "object") {
    return { type: "immediate" };
  }

  const schedule = raw as Partial<WorkflowScheduleConfig>;
  const type =
    schedule.type === "delay" ||
    schedule.type === "daily" ||
    schedule.type === "weekly"
      ? schedule.type
      : "immediate";

  return {
    type,
    delayMs:
      typeof schedule.delayMs === "number" && schedule.delayMs > 0
        ? Math.min(schedule.delayMs, MAX_SERVER_DELAY_MS)
        : undefined,
    hour:
      typeof schedule.hour === "number"
        ? Math.min(23, Math.max(0, schedule.hour))
        : 9,
    dayOfWeek:
      typeof schedule.dayOfWeek === "number"
        ? Math.min(6, Math.max(0, schedule.dayOfWeek))
        : 1,
  };
}

export function computeNextRunAt(
  schedule: WorkflowScheduleConfig,
  from = Date.now(),
): number {
  if (schedule.type === "immediate") return from;
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

  const targetDay = schedule.dayOfWeek ?? 1;
  const currentDay = next.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  if (daysUntil === 0 && next.getTime() <= from) {
    daysUntil = 7;
  }
  next.setDate(next.getDate() + daysUntil);
  return next.getTime();
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

export function getServerDelayMs(schedule: WorkflowScheduleConfig): number {
  if (schedule.type !== "delay" || !schedule.delayMs) return 0;
  return Math.min(schedule.delayMs, MAX_SERVER_DELAY_MS);
}

/** In-memory schedule registry stub (resets on server restart). */
const scheduledRuns = new Map<string, WorkflowScheduledRun>();

export function registerWorkflowSchedule(input: {
  workflowId: string;
  triggerNodeId: string;
  schedule: WorkflowScheduleConfig;
}): WorkflowScheduledRun {
  const key = `${input.workflowId}:${input.triggerNodeId}`;
  const run: WorkflowScheduledRun = {
    workflowId: input.workflowId,
    triggerNodeId: input.triggerNodeId,
    schedule: input.schedule,
    nextRunAt: computeNextRunAt(input.schedule),
    registeredAt: Date.now(),
  };
  scheduledRuns.set(key, run);
  return run;
}

export function getWorkflowSchedule(
  workflowId: string,
  triggerNodeId: string,
): WorkflowScheduledRun | null {
  return scheduledRuns.get(`${workflowId}:${triggerNodeId}`) ?? null;
}