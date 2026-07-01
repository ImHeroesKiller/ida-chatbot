import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { recordWorkflowAudit } from "@/lib/workflow-security";
import {
  listWorkflowSchedules,
  listWorkflowTriggerEvents,
  setWorkflowScheduleEnabled,
} from "@/lib/workflow-scheduler";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get("limit") ?? "200", 10);
  const capped = Number.isFinite(limit) ? Math.min(limit, 500) : 200;

  const [schedules, events] = await Promise.all([
    listWorkflowSchedules({ limit: capped }),
    listWorkflowTriggerEvents({ limit: capped }),
  ]);

  return NextResponse.json({ schedules, events });
}

const patchSchema = z.object({
  scheduleId: z.string().uuid(),
  enabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ok = await setWorkflowScheduleEnabled(
    parsed.data.scheduleId,
    parsed.data.enabled,
  );

  if (!ok) {
    return NextResponse.json(
      { error: "Failed to update schedule." },
      { status: 500 },
    );
  }

  if (!parsed.data.enabled) {
    await recordWorkflowAudit({
      action: "workflow.trigger_disabled",
      actorType: "admin",
      details: { scheduleId: parsed.data.scheduleId },
    });
  }

  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}