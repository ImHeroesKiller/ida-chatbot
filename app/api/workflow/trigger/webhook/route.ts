import { NextResponse } from "next/server";

import { recordWorkflowAudit } from "@/lib/workflow-security";
import type { WorkflowDefinition } from "@/lib/workflow";
import { executeChatWorkflowStream } from "@/lib/workflow-executor";
import {
  advanceWorkflowScheduleAfterRun,
  formatScheduleLabel,
  getWorkflowScheduleByWebhookToken,
  recordWorkflowTriggerEvent,
} from "@/lib/workflow-scheduler";

function readWorkflowSnapshot(
  snapshot: Record<string, unknown> | null,
): WorkflowDefinition | null {
  if (!snapshot || typeof snapshot !== "object") return null;

  const workflow = snapshot as Partial<WorkflowDefinition>;
  if (
    typeof workflow.id !== "string" ||
    !Array.isArray(workflow.nodes) ||
    !Array.isArray(workflow.edges)
  ) {
    return null;
  }

  return workflow as WorkflowDefinition;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Missing webhook token." }, { status: 400 });
  }

  const schedule = await getWorkflowScheduleByWebhookToken(token);
  if (!schedule) {
    return NextResponse.json({ error: "Unknown or disabled webhook." }, { status: 404 });
  }

  let payload: Record<string, unknown> = {};
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      payload = body as Record<string, unknown>;
    }
  } catch {
    // Empty body is allowed for simple webhook pings.
  }

  const workflow = readWorkflowSnapshot(schedule.workflowSnapshot);
  if (!workflow) {
    await recordWorkflowTriggerEvent({
      scheduleId: schedule.id,
      workflowId: schedule.workflowId,
      eventType: "webhook",
      status: "failed",
      payload: { ...payload, error: "Missing workflow snapshot." },
    });
    return NextResponse.json(
      { error: "Workflow snapshot not available." },
      { status: 422 },
    );
  }

  let dispatchError: string | undefined;

  try {
    for await (const event of executeChatWorkflowStream({
      workflow,
      locale: "en",
      sessionId: schedule.sessionId ?? undefined,
      actorUserId: schedule.userId,
    })) {
      if (event.type === "error") {
        dispatchError = event.message;
      }
    }
  } catch (error) {
    dispatchError =
      error instanceof Error ? error.message : "Webhook dispatch failed.";
  }

  const status = dispatchError ? "failed" : "dispatched";

  await recordWorkflowTriggerEvent({
    scheduleId: schedule.id,
    workflowId: schedule.workflowId,
    eventType: "webhook",
    status,
    payload,
  });

  if (!dispatchError) {
    await advanceWorkflowScheduleAfterRun(schedule);
    await recordWorkflowAudit({
      workflowId: schedule.workflowId,
      workflowName: schedule.workflowName,
      userId: schedule.userId,
      sessionId: schedule.sessionId,
      action: "workflow.trigger_fired",
      actorType: "system",
      details: {
        scheduleId: schedule.id,
        scheduleType: schedule.scheduleType,
        label: formatScheduleLabel(schedule.scheduleConfig, "en"),
        source: "webhook",
      },
    });
  }

  if (dispatchError) {
    return NextResponse.json({ error: dispatchError }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    workflowId: schedule.workflowId,
    message: "Webhook trigger dispatched.",
  });
}