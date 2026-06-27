import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { reindexKbDocument } from "@/lib/rag/kb-service";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const result = await reindexKbDocument(id);
    return NextResponse.json({
      ok: true,
      document: result.document,
      chunksIndexed: result.chunksIndexed,
    });
  } catch (error) {
    console.error("[IDA admin kb document reindex]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to re-index document.",
      },
      { status: 500 },
    );
  }
}