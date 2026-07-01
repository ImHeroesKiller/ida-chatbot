import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { recordWorkflowAudit } from "@/lib/workflow-security";
import { workflowDefinitionSchema } from "@/lib/workflow-api-schema";
import {
  computeNextRunAt,
  deleteWorkflowSchedule,
  formatScheduleLabel,
  listWorkflowSchedules,
  registerWorkflowSchedule,
  type WorkflowScheduleConfig,
} from "@/lib/workflow-scheduler";

const scheduleTypeSchema = z.enum([
  "immediate",
  "delay",
  "daily",
  "weekly",
  "monthly",
  "event_email",
  "event_webhook",
  "event_calendar",
]);

const scheduleConfigSchema = z.object({
  type: scheduleTypeSchema,
  delayMs: z.number().int().min(0).max(86_400_000).optional(),
  hour: z.number().int().min(0).max(23).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  eventFilter: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
});

const scheduleRequestSchema = z.object({
  workflowId: z.string().min(1),
  triggerNodeId: z.string().min(1),
  schedule: scheduleConfigSchema,
  workflow: workflowDefinitionSchema.optional(),
  sessionId: z.string().min(8).max(64).optional(),
});

const deleteRequestSchema = z.object({
  workflowId: z.string().min(1),
  triggerNodeId: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflowId") ?? undefined;
  const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10);

  const schedules = await listWorkflowSchedules({
    workflowId,
    limit: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = scheduleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid schedule payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const schedule = parsed.data.schedule as WorkflowScheduleConfig;
  const user = await getSessionUser();
  const actorUserId = user?.id ?? parsed.data.sessionId ?? null;

  const run = await registerWorkflowSchedule({
    workflowId: parsed.data.workflowId,
    workflowName: parsed.data.workflow?.name ?? null,
    triggerNodeId: parsed.data.triggerNodeId,
    schedule,
    sessionId: parsed.data.sessionId ?? null,
    userId: actorUserId,
    workflowSnapshot: parsed.data.workflow
      ? (parsed.data.workflow as Record<string, unknown>)
      : null,
  });

  await recordWorkflowAudit({
    workflowId: parsed.data.workflowId,
    workflowName: parsed.data.workflow?.name ?? null,
    userId: actorUserId,
    sessionId: parsed.data.sessionId ?? null,
    action: "workflow.scheduled",
    details: {
      triggerNodeId: parsed.data.triggerNodeId,
      scheduleType: schedule.type,
      nextRunAt: run.nextRunAt,
      label: formatScheduleLabel(schedule, "en"),
      webhookToken: run.webhookToken ?? null,
    },
  });

  const webhookUrl =
    run.webhookToken && typeof request.url === "string"
      ? `${new URL(request.url).origin}/api/workflow/trigger/webhook?token=${run.webhookToken}`
      : null;

  return NextResponse.json({
    ok: true,
    scheduled: schedule.type !== "immediate",
    nextRunAt: run.nextRunAt,
    label: formatScheduleLabel(schedule, "en"),
    webhookUrl,
    webhookToken: run.webhookToken ?? null,
    message:
      schedule.type === "immediate"
        ? "Workflow will run immediately on next execute."
        : schedule.type === "event_webhook"
          ? "Webhook trigger registered."
          : `Scheduled for ${run.nextRunAt ? new Date(run.nextRunAt).toISOString() : "event"}`,
    computePreview: computeNextRunAt(schedule),
  });
}

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = deleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid delete payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await deleteWorkflowSchedule(
    parsed.data.workflowId,
    parsed.data.triggerNodeId,
  );

  return NextResponse.json({ ok: true });
}