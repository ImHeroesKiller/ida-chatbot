import { NextRequest, NextResponse } from "next/server";

import { listMediaModels } from "@/lib/admin/media-models";
import type { MediaCategory } from "@/lib/admin/types";

/**
 * Public endpoint to list active media models for client-side selection
 * (used by image-gen panel etc.). No secrets exposed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as MediaCategory | null;

    if (!category || !["image", "video", "music"].includes(category)) {
      return NextResponse.json({ error: "category required (image|video|music)" }, { status: 400 });
    }

    const models = await listMediaModels(category);
    // Only return safe fields for client
    const safeModels = models
      .filter((m) => m.is_active)
      .map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        model_id: m.model_id,
        default_settings: m.default_settings,
      }));

    return NextResponse.json({ models: safeModels });
  } catch (error) {
    console.error("[media-models] public list error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
