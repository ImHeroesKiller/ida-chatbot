import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { getWorkflowAnalytics } from "@/lib/admin/workflow-analytics";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const analytics = await getWorkflowAnalytics();
  return NextResponse.json({ analytics });
}