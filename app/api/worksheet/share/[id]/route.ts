import { NextResponse } from "next/server";

import { getSharedWorksheet } from "@/lib/worksheet-share-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const record = await getSharedWorksheet(id);

  if (!record) {
    return NextResponse.json({ error: "Share not found or expired." }, { status: 404 });
  }

  return NextResponse.json({
    id: record.id,
    title: record.title,
    content: record.content,
    locale: record.locale,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  });
}