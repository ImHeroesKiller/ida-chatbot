import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { listWorkflowAuditLogs } from "@/lib/workflow-security";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflowId") ?? undefined;
  const limit = Number.parseInt(searchParams.get("limit") ?? "200", 10);

  const logs = await listWorkflowAuditLogs({
    workflowId,
    limit: Number.isFinite(limit) ? Math.min(limit, 500) : 200,
  });

  return NextResponse.json({ logs });
}