import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { parseWorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import { worksheetLetterheadTemplateUpdateSchema } from "@/lib/worksheet-branding-schema";
import {
  deleteWorksheetLetterheadTemplate,
  getWorksheetLetterheadTemplate,
  updateWorksheetLetterheadTemplate,
} from "@/lib/worksheet-letterhead-templates-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const template = await getWorksheetLetterheadTemplate(id);
    if (!template) {
      return NextResponse.json(
        { error: "Letterhead template not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[IDA admin worksheet-letterhead GET]", error);
    return NextResponse.json(
      { error: "Failed to load letterhead template." },
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

  const parsed = worksheetLetterheadTemplateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid letterhead template payload." },
      { status: 400 },
    );
  }

  try {
    const template = await updateWorksheetLetterheadTemplate(id, {
      name: parsed.data.name,
      brandingConfig: parsed.data.brandingConfig
        ? parseWorksheetBrandingConfig(parsed.data.brandingConfig)
        : undefined,
      isDefault: parsed.data.isDefault,
    });

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    console.error("[IDA admin worksheet-letterhead PUT]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update letterhead template.",
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
    await deleteWorksheetLetterheadTemplate(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[IDA admin worksheet-letterhead DELETE]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete letterhead template.",
      },
      { status: 500 },
    );
  }
}