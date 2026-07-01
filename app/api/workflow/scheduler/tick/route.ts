import { NextResponse } from "next/server";

import { runWorkflowSchedulerTick } from "@/lib/workflow-scheduler";

function isAuthorized(request: Request): boolean {
  const secret = process.env.WORKFLOW_SCHEDULER_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${secret}`) return true;

  const header = request.headers.get("x-workflow-scheduler-secret");
  return header === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runWorkflowSchedulerTick();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runWorkflowSchedulerTick();
  return NextResponse.json({ ok: true, ...result });
}