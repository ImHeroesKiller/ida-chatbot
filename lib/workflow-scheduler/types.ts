/** Cron-like and event-based workflow trigger types (Phase 3.4). */
export type WorkflowScheduleType =
  | "immediate"
  | "delay"
  | "daily"
  | "weekly"
  | "monthly"
  | "event_email"
  | "event_webhook"
  | "event_calendar";

export type WorkflowTriggerEventType =
  | "cron_tick"
  | "webhook"
  | "email"
  | "calendar"
  | "manual"
  | "delay";

export type WorkflowTriggerEventStatus =
  | "pending"
  | "dispatched"
  | "failed"
  | "skipped";

export interface WorkflowScheduleConfig {
  type: WorkflowScheduleType;
  /** Delay in milliseconds (delay type). */
  delayMs?: number;
  /** Hour of day 0-23 (daily/weekly/monthly). */
  hour?: number;
  /** Day of week 0=Sunday (weekly). */
  dayOfWeek?: number;
  /** Day of month 1-31 (monthly). */
  dayOfMonth?: number;
  /** Optional filter for email/calendar event triggers. */
  eventFilter?: string;
  /** When false the schedule is registered but inactive. */
  enabled?: boolean;
}

export interface WorkflowScheduledRun {
  workflowId: string;
  triggerNodeId: string;
  schedule: WorkflowScheduleConfig;
  nextRunAt: number | null;
  registeredAt: number;
  webhookToken?: string | null;
}

export interface WorkflowScheduleRecord {
  id: string;
  workflowId: string;
  workflowName: string | null;
  triggerNodeId: string;
  sessionId: string | null;
  userId: string | null;
  scheduleType: WorkflowScheduleType;
  scheduleConfig: WorkflowScheduleConfig;
  cronExpression: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  enabled: boolean;
  webhookToken: string | null;
  runCount: number;
  workflowSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTriggerEventRecord {
  id: string;
  scheduleId: string | null;
  workflowId: string | null;
  eventType: WorkflowTriggerEventType;
  payload: Record<string, unknown>;
  status: WorkflowTriggerEventStatus;
  createdAt: string;
}