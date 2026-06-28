import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { parseWorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import {
  loadWorksheetBrandingConfig,
  saveWorksheetBrandingConfig,
} from "@/lib/worksheet-branding-server";

const brandingSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  footerText: z.string().trim().min(1).max(80),
  logoDataUrl: z
    .string()
    .nullable()
    .refine(
      (value) =>
        value === null ||
        (value.startsWith("data:image/") && value.length <= 250_000),
      "Invalid logo data URL.",
    ),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const config = await loadWorksheetBrandingConfig({ bypassCache: true });

  return NextResponse.json({ config });
}

export async function PUT(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = brandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid worksheet branding payload." },
      { status: 400 },
    );
  }

  const normalized = parseWorksheetBrandingConfig(parsed.data);

  try {
    await saveWorksheetBrandingConfig(normalized);
    return NextResponse.json({ ok: true, config: normalized });
  } catch (error) {
    console.error("[IDA admin worksheet-branding PUT]", error);
    return NextResponse.json(
      { error: "Failed to save worksheet branding." },
      { status: 500 },
    );
  }
}