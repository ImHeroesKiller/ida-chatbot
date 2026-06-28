import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { setDefaultWorksheetLetterheadTemplate } from "@/lib/worksheet-letterhead-templates-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const template = await setDefaultWorksheetLetterheadTemplate(id);
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    console.error("[IDA admin worksheet-letterhead default POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to set default letterhead template.",
      },
      { status: 500 },
    );
  }
}