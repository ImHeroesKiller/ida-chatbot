import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { isValidHexColor, normalizeHexColor } from "@/lib/ui-config/color";
import { DEFAULT_UI_CONFIG } from "@/lib/ui-config/defaults";
import { loadUiConfig, saveUiConfig } from "@/lib/ui-config/server";
import type { IdaUiConfig } from "@/lib/ui-config/types";

const uiConfigSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  animationLevel: z.enum(["full", "reduced", "none"]),
  primaryColor: z
    .string()
    .trim()
    .refine((value) => isValidHexColor(value), "Invalid hex color."),
  messageMaxWidth: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?(rem|px|ch)$/, "Invalid max width."),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const config = await loadUiConfig({ bypassCache: true });

  return NextResponse.json({
    config,
    defaults: DEFAULT_UI_CONFIG,
  });
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

  const parsed = uiConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid UI config payload." }, { status: 400 });
  }

  const normalized: IdaUiConfig = {
    ...parsed.data,
    primaryColor:
      normalizeHexColor(parsed.data.primaryColor) ?? DEFAULT_UI_CONFIG.primaryColor,
  };

  try {
    await saveUiConfig(normalized);
    return NextResponse.json({ ok: true, config: normalized });
  } catch (error) {
    console.error("[IDA admin ui-config PUT]", error);
    return NextResponse.json(
      { error: "Failed to save UI configuration." },
      { status: 500 },
    );
  }
}