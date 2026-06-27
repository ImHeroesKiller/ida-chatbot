import { NextResponse } from "next/server";
import { z } from "zod";

import { loadAppConfig } from "@/lib/admin/config";
import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { GroqTranscribeError } from "@/lib/voice/groq-transcribe";
import { transcribeAudio } from "@/lib/voice/transcribe-service";

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
  const appConfig = await loadAppConfig();

  if (!appConfig.features.voice) {
    return NextResponse.json(
      { error: "Voice input is disabled by administrator." },
      { status: 403 },
    );
  }

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
    const { transcript, provider } = await transcribeAudio({
      data,
      mimeType,
      locale,
    });

    return NextResponse.json({ transcript, provider });
  } catch (error) {
    console.error("[IDA transcribe-groq]", error);

    const notConfigured =
      (error instanceof GroqTranscribeError &&
        error.message === "GROQ_API_KEY is not configured.") ||
      (error instanceof Error &&
        error.message === "GEMINI_API_KEY is not configured.");

    const message = notConfigured
      ? "Transcribe service is not configured."
      : "Failed to transcribe audio.";

    return NextResponse.json({ error: message }, { status: notConfigured ? 503 : 500 });
  }
}