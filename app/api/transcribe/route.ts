import { NextResponse } from "next/server";
import { z } from "zod";

import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { transcribeAudioWithGemini } from "@/lib/voice/gemini-transcribe";

const MAX_AUDIO_BASE64_LENGTH = 8_000_000;

const transcribeRequestSchema = z.object({
  data: z.string().min(1).max(MAX_AUDIO_BASE64_LENGTH),
  mimeType: z.string().min(1).max(64),
  locale: z.enum(LOCALES),
  sessionId: z.string().min(8).max(64).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = transcribeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transcribe payload." }, { status: 400 });
  }

  const { data, mimeType, locale, sessionId } = parsed.data;

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId })}:transcribe`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSec) },
        },
      );
    }
    throw error;
  }

  try {
    const transcript = await transcribeAudioWithGemini({ data, mimeType, locale });

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("[IDA transcribe]", error);

    const message =
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured."
        ? "Transcribe service is not configured."
        : "Failed to transcribe audio.";

    const status =
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured."
        ? 503
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}