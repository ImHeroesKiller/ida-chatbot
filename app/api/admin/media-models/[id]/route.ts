import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { deleteMediaModel, getMediaModel, updateMediaModel } from "@/lib/admin/media-models";
import { requireAdmin } from "@/lib/admin/guard";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  provider: z.string().min(1).max(50).optional(),
  model_id: z.string().min(1).max(200).optional(),
  api_endpoint: z.string().url().optional().or(z.literal("")).nullable(),
  is_active: z.boolean().optional(),
  default_settings: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const model = await getMediaModel(id);
    if (!model) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ model });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[admin/media-models] GET [id] error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const model = await updateMediaModel(id, {
      name: parsed.name,
      provider: parsed.provider,
      model_id: parsed.model_id,
      api_endpoint: parsed.api_endpoint,
      is_active: parsed.is_active,
      default_settings: parsed.default_settings,
    });
    return NextResponse.json({ model });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    console.error("[admin/media-models] PUT error", error);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteMediaModel(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[admin/media-models] DELETE error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
