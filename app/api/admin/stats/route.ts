import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { getAdminStats } from "@/lib/admin/request-logs";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const stats = await getAdminStats();
  return NextResponse.json({ stats });
}