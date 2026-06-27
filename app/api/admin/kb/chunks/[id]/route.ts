import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import {
  deleteKbChunk,
  getKbChunk,
  updateKbChunk,
} from "@/lib/rag/kb-service";

const updateSchema = z.object({
  content: z.string().min(1).max(20_000),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const chunk = await getKbChunk(id);
    if (!chunk) {
      return NextResponse.json({ error: "Chunk not found." }, { status: 404 });
    }

    return NextResponse.json({ chunk });
  } catch (error) {
    console.error("[IDA admin kb chunk GET]", error);
    return NextResponse.json(
      { error: "Failed to load chunk." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chunk payload." }, { status: 400 });
  }

  try {
    const chunk = await updateKbChunk(id, parsed.data);
    return NextResponse.json({ ok: true, chunk });
  } catch (error) {
    console.error("[IDA admin kb chunk PUT]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update chunk.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    await deleteKbChunk(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[IDA admin kb chunk DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete chunk." },
      { status: 500 },
    );
  }
}