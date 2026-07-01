import { randomBytes, randomUUID } from "crypto";

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

import {
  buildCronExpression,
  computeNextRunAt,
  isPersistedScheduleType,
} from "./schedule";
import type {
  WorkflowScheduleConfig,
  WorkflowScheduleRecord,
  WorkflowScheduledRun,
  WorkflowTriggerEventRecord,
  WorkflowTriggerEventStatus,
  WorkflowTriggerEventType,
} from "./types";

function mapScheduleRow(row: Record<string, unknown>): WorkflowScheduleRecord {
  return {
    id: row.id as string,
    workflowId: row.workflow_id as string,
    workflowName: (row.workflow_name as string | null) ?? null,
    triggerNodeId: row.trigger_node_id as string,
    sessionId: (row.session_id as string | null) ?? null,
    userId: (row.user_id as string | null) ?? null,
    scheduleType: row.schedule_type as WorkflowScheduleRecord["scheduleType"],
    scheduleConfig:
      (row.schedule_config as WorkflowScheduleConfig) ?? { type: "immediate" },
    cronExpression: (row.cron_expression as string | null) ?? null,
    nextRunAt: (row.next_run_at as string | null) ?? null,
    lastRunAt: (row.last_run_at as string | null) ?? null,
    enabled: Boolean(row.enabled),
    webhookToken: (row.webhook_token as string | null) ?? null,
    runCount: Number(row.run_count ?? 0),
    workflowSnapshot:
      (row.workflow_snapshot as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTriggerEventRow(
  row: Record<string, unknown>,
): WorkflowTriggerEventRecord {
  return {
    id: row.id as string,
    scheduleId: (row.schedule_id as string | null) ?? null,
    workflowId: (row.workflow_id as string | null) ?? null,
    eventType: row.event_type as WorkflowTriggerEventRecord["eventType"],
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as WorkflowTriggerEventRecord["status"],
    createdAt: row.created_at as string,
  };
}

function createWebhookToken(): string {
  return randomBytes(24).toString("hex");
}

/** In-memory fallback when Supabase is unavailable. */
const scheduledRuns = new Map<string, WorkflowScheduledRun>();

export async function registerWorkflowSchedule(input: {
  workflowId: string;
  workflowName?: string | null;
  triggerNodeId: string;
  schedule: WorkflowScheduleConfig;
  sessionId?: string | null;
  userId?: string | null;
  workflowSnapshot?: Record<string, unknown> | null;
}): Promise<WorkflowScheduledRun> {
  const key = `${input.workflowId}:${input.triggerNodeId}`;
  const nextRunAt = computeNextRunAt(input.schedule);
  const webhookToken =
    input.schedule.type === "event_webhook" ? createWebhookToken() : null;

  const run: WorkflowScheduledRun = {
    workflowId: input.workflowId,
    triggerNodeId: input.triggerNodeId,
    schedule: input.schedule,
    nextRunAt,
    registeredAt: Date.now(),
    webhookToken,
  };
  scheduledRuns.set(key, run);

  if (!isSupabaseConfigured() || !isPersistedScheduleType(input.schedule.type)) {
    return run;
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const cronExpression = buildCronExpression(input.schedule);
    const enabled = input.schedule.enabled !== false;

    const { error } = await supabase.from("ida_workflow_schedules").upsert(
      {
        workflow_id: input.workflowId,
        workflow_name: input.workflowName ?? null,
        trigger_node_id: input.triggerNodeId,
        session_id: input.sessionId ?? null,
        user_id: input.userId ?? null,
        schedule_type: input.schedule.type,
        schedule_config: input.schedule,
        cron_expression: cronExpression,
        next_run_at:
          nextRunAt !== null ? new Date(nextRunAt).toISOString() : null,
        enabled,
        webhook_token: webhookToken,
        workflow_snapshot: input.workflowSnapshot ?? null,
        updated_at: now,
      },
      { onConflict: "workflow_id,trigger_node_id" },
    );

    if (error) {
      console.error("[IDA workflow-schedule upsert]", error);
    }
  } catch (error) {
    console.error("[IDA workflow-schedule register]", error);
  }

  return run;
}

export function getWorkflowSchedule(
  workflowId: string,
  triggerNodeId: string,
): WorkflowScheduledRun | null {
  return scheduledRuns.get(`${workflowId}:${triggerNodeId}`) ?? null;
}

export async function listWorkflowSchedules(options?: {
  workflowId?: string;
  limit?: number;
}): Promise<WorkflowScheduleRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const limit = options?.limit ?? 200;

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("ida_workflow_schedules")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (options?.workflowId) {
      query = query.eq("workflow_id", options.workflowId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => mapScheduleRow(row as Record<string, unknown>));
  } catch (error) {
    console.error("[IDA workflow-schedule list]", error);
    return [];
  }
}

export async function getWorkflowScheduleByWebhookToken(
  token: string,
): Promise<WorkflowScheduleRecord | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_workflow_schedules")
      .select("*")
      .eq("webhook_token", token)
      .eq("enabled", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapScheduleRow(data as Record<string, unknown>);
  } catch (error) {
    console.error("[IDA workflow-schedule webhook lookup]", error);
    return null;
  }
}

export async function setWorkflowScheduleEnabled(
  scheduleId: string,
  enabled: boolean,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("ida_workflow_schedules")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", scheduleId);

    return !error;
  } catch (error) {
    console.error("[IDA workflow-schedule enable]", error);
    return false;
  }
}

export async function recordWorkflowTriggerEvent(input: {
  scheduleId?: string | null;
  workflowId?: string | null;
  eventType: WorkflowTriggerEventType;
  payload?: Record<string, unknown>;
  status?: WorkflowTriggerEventStatus;
}): Promise<WorkflowTriggerEventRecord | null> {
  const entry: WorkflowTriggerEventRecord = {
    id: randomUUID(),
    scheduleId: input.scheduleId ?? null,
    workflowId: input.workflowId ?? null,
    eventType: input.eventType,
    payload: input.payload ?? {},
    status: input.status ?? "pending",
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) return entry;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("ida_workflow_trigger_events").insert({
      id: entry.id,
      schedule_id: entry.scheduleId,
      workflow_id: entry.workflowId,
      event_type: entry.eventType,
      payload: entry.payload,
      status: entry.status,
      created_at: entry.createdAt,
    });

    if (error) {
      console.error("[IDA workflow-trigger-event insert]", error);
    }
  } catch (error) {
    console.error("[IDA workflow-trigger-event]", error);
  }

  return entry;
}

export async function listWorkflowTriggerEvents(options?: {
  limit?: number;
}): Promise<WorkflowTriggerEventRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const limit = options?.limit ?? 200;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_workflow_trigger_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row) =>
      mapTriggerEventRow(row as Record<string, unknown>),
    );
  } catch (error) {
    console.error("[IDA workflow-trigger-event list]", error);
    return [];
  }
}

export async function listDueWorkflowSchedules(
  limit = 20,
): Promise<WorkflowScheduleRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const now = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_workflow_schedules")
      .select("*")
      .eq("enabled", true)
      .not("next_run_at", "is", null)
      .lte("next_run_at", now)
      .order("next_run_at", { ascending: true })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row) => mapScheduleRow(row as Record<string, unknown>));
  } catch (error) {
    console.error("[IDA workflow-schedule due]", error);
    return [];
  }
}

export async function advanceWorkflowScheduleAfterRun(
  record: WorkflowScheduleRecord,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const config = record.scheduleConfig;
  const isRecurring =
    config.type === "daily" ||
    config.type === "weekly" ||
    config.type === "monthly";
  const nextRunAt = isRecurring ? computeNextRunAt(config) : null;
  const now = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("ida_workflow_schedules")
      .update({
        last_run_at: now,
        next_run_at:
          nextRunAt !== null ? new Date(nextRunAt).toISOString() : null,
        run_count: record.runCount + 1,
        updated_at: now,
      })
      .eq("id", record.id);
  } catch (error) {
    console.error("[IDA workflow-schedule advance]", error);
  }
}

export async function deleteWorkflowSchedule(
  workflowId: string,
  triggerNodeId: string,
): Promise<void> {
  scheduledRuns.delete(`${workflowId}:${triggerNodeId}`);

  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("ida_workflow_schedules")
      .delete()
      .eq("workflow_id", workflowId)
      .eq("trigger_node_id", triggerNodeId);
  } catch (error) {
    console.error("[IDA workflow-schedule delete]", error);
  }
}