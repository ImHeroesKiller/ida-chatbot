import { NextResponse } from "next/server";
import { z } from "zod";

import { parseWorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import { worksheetBrandingConfigSchema } from "@/lib/worksheet-branding-schema";
import { createWorksheetLetterheadTemplate } from "@/lib/worksheet-letterhead-templates-server";

const saveTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brandingConfig: worksheetBrandingConfigSchema,
  sampleContent: z.string().trim().max(50_000).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = saveTemplateSchema.safeParse(body);
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
      isDefault: false,
      createdBy: "user",
      sampleContent: parsed.data.sampleContent,
    });

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    console.error("[IDA worksheet save-letterhead-template POST]", error);
    return NextResponse.json(
      { error: "Failed to save letterhead template." },
      { status: 500 },
    );
  }
}