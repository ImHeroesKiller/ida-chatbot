import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { getKbStats, listKbDocuments } from "@/lib/rag/kb-service";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const [documents, stats] = await Promise.all([
      listKbDocuments(),
      getKbStats(),
    ]);

    return NextResponse.json({ documents, stats });
  } catch (error) {
    console.error("[IDA admin kb documents GET]", error);
    return NextResponse.json(
      { error: "Failed to list knowledge documents." },
      { status: 500 },
    );
  }
}