import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createMediaModel, listMediaModels } from "@/lib/admin/media-models";
import { requireAdmin } from "@/lib/admin/guard";
import type { MediaCategory } from "@/lib/admin/types";

const categorySchema = z.enum(["image", "video", "music"]);

const createSchema = z.object({
  category: categorySchema,
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(50),
  model_id: z.string().min(1).max(200),
  api_endpoint: z.string().url().optional().or(z.literal("")).nullable(),
  is_active: z.boolean().optional(),
  default_settings: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as MediaCategory | null;

    const models = await listMediaModels(category || undefined);
    return NextResponse.json({ models });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[admin/media-models] GET error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const model = await createMediaModel({
      category: parsed.category,
      name: parsed.name,
      provider: parsed.provider,
      model_id: parsed.model_id,
      api_endpoint: parsed.api_endpoint || null,
      is_active: parsed.is_active ?? true,
      default_settings: parsed.default_settings ?? {},
    });

    return NextResponse.json({ model }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("[admin/media-models] POST error", error);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
