import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";
import { parseWorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import { worksheetLetterheadTemplateInputSchema } from "@/lib/worksheet-branding-schema";
import { loadWorksheetBrandingConfig } from "@/lib/worksheet-branding-server";
import {
  createWorksheetLetterheadTemplate,
  listWorksheetLetterheadTemplates,
  seedDefaultLetterheadFromLegacyBranding,
} from "@/lib/worksheet-letterhead-templates-server";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    let templates = await listWorksheetLetterheadTemplates({
      bypassCache: true,
    });

    if (templates.length === 0) {
      const legacy = await loadWorksheetBrandingConfig({ bypassCache: true });
      await seedDefaultLetterheadFromLegacyBranding(legacy);
      templates = await listWorksheetLetterheadTemplates({ bypassCache: true });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[IDA admin worksheet-letterhead GET]", error);
    return NextResponse.json(
      { error: "Failed to load letterhead templates." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = worksheetLetterheadTemplateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid letterhead template payload." },
      { status: 400 },
    );
  }

  try {
    const template = await createWorksheetLetterheadTemplate({
      name: parsed.data.name,
      brandingConfig: parseWorksheetBrandingConfig(parsed.data.brandingConfig),
      isDefault: parsed.data.isDefault,
      createdBy: "admin",
    });

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    console.error("[IDA admin worksheet-letterhead POST]", error);
    return NextResponse.json(
      { error: "Failed to create letterhead template." },
      { status: 500 },
    );
  }
}