import { NextResponse } from "next/server";
import { z } from "zod";

import {
  computeNextRunAt,
  formatScheduleLabel,
  parseTriggerSchedule,
  registerWorkflowSchedule,
  type WorkflowScheduleConfig,
} from "@/lib/workflow-scheduler";
import { workflowDefinitionSchema } from "@/lib/workflow-api-schema";

const scheduleRequestSchema = z.object({
  workflowId: z.string().min(1),
  triggerNodeId: z.string().min(1),
  schedule: z.object({
    type: z.enum(["immediate", "delay", "daily", "weekly"]),
    delayMs: z.number().int().min(0).max(86_400_000).optional(),
    hour: z.number().int().min(0).max(23).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
  }),
  workflow: workflowDefinitionSchema.optional(),
});

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
  const run = registerWorkflowSchedule({
    workflowId: parsed.data.workflowId,
    triggerNodeId: parsed.data.triggerNodeId,
    schedule,
  });

  return NextResponse.json({
    ok: true,
    scheduled: schedule.type !== "immediate",
    nextRunAt: run.nextRunAt,
    label: formatScheduleLabel(schedule, "en"),
    message:
      schedule.type === "immediate"
        ? "Workflow will run immediately on next execute."
        : `Scheduled for ${new Date(run.nextRunAt).toISOString()}`,
    computePreview: computeNextRunAt(schedule),
  });
}