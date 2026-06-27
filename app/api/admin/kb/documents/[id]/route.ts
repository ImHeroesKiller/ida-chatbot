import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { deleteKbDocument, getKbDocument } from "@/lib/rag/kb-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const document = await getKbDocument(id);
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("[IDA admin kb document GET]", error);
    return NextResponse.json(
      { error: "Failed to load document." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    await deleteKbDocument(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[IDA admin kb document DELETE]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete document.",
      },
      { status: 500 },
    );
  }
}