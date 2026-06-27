import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { listRequestLogs } from "@/lib/admin/request-logs";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "100");

  const logs = await listRequestLogs({
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100,
  });

  return NextResponse.json({ logs });
}