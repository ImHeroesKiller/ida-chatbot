import { NextResponse } from "next/server";

import type { Locale } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { createSharedWorksheet } from "@/lib/worksheet-share-store";

const VALID_LOCALES = new Set<Locale>(["id", "en", "zh"]);

export async function POST(request: Request) {
  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request) })}:worksheet-share`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429 },
      );
    }

    throw error;
  }

  let body: { title?: string; content?: string; locale?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const locale = body.locale as Locale;
  if (!VALID_LOCALES.has(locale)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  try {
    const record = createSharedWorksheet({
      title: body.title ?? "",
      content: body.content ?? "",
      locale,
    });

    const origin = new URL(request.url).origin;

    return NextResponse.json({
      id: record.id,
      url: `${origin}/worksheet/share/${record.id}`,
      expiresAt: record.expiresAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create share link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}