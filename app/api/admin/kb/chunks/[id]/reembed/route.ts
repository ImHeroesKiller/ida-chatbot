import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { getKbChunk, updateKbChunk } from "@/lib/rag/kb-service";

const previewSchema = z.object({
  content: z.string().min(1).max(20_000),
  previewOnly: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid re-embed payload." }, { status: 400 });
  }

  try {
    const existing = await getKbChunk(id);
    if (!existing) {
      return NextResponse.json({ error: "Chunk not found." }, { status: 404 });
    }

    const content = parsed.data.content.trim();

    if (parsed.data.previewOnly) {
      return NextResponse.json({
        preview: {
          content,
          length: content.length,
          wordCount: content.split(/\s+/).filter(Boolean).length,
          source: existing.pageSlug,
          section: existing.section,
          locale: existing.locale,
        },
      });
    }

    const chunk = await updateKbChunk(id, { content });
    return NextResponse.json({ ok: true, chunk });
  } catch (error) {
    console.error("[IDA admin kb chunk reembed]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to re-embed chunk.",
      },
      { status: 500 },
    );
  }
}