import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { LOCALES } from "@/lib/config";
import { listKbChunks } from "@/lib/rag/kb-service";

const querySchema = z.object({
  search: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
  sourceType: z.enum(["knowledge", "faq", "guide"]).optional(),
  pageSlug: z.string().optional(),
  section: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    locale: searchParams.get("locale") ?? undefined,
    sourceType: searchParams.get("sourceType") ?? undefined,
    pageSlug: searchParams.get("pageSlug") ?? undefined,
    section: searchParams.get("section") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  try {
    const result = await listKbChunks(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[IDA admin kb chunks GET]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list knowledge chunks.",
      },
      { status: 500 },
    );
  }
}