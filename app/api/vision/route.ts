import { NextResponse } from "next/server";
import { z } from "zod";

import { loadAppConfig } from "@/lib/admin/config";
import { LOCALES } from "@/lib/config";
import { extractTextWithGeminiVision } from "@/lib/vision/gemini-vision";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";

const MAX_BASE64_LENGTH = 14_000_000;

const visionRequestSchema = z.object({
  data: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ]),
  fileName: z.string().min(1).max(255),
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

  const parsed = visionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vision payload." }, { status: 400 });
  }

  const { data, mimeType, fileName, locale, sessionId } = parsed.data;
  const appConfig = await loadAppConfig();

  if (!appConfig.features.ocr) {
    return NextResponse.json(
      { error: "OCR is disabled by administrator." },
      { status: 403 },
    );
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId })}:vision`,
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
    const result = await extractTextWithGeminiVision({
      data,
      mimeType,
      fileName,
      locale,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[IDA vision]", error);

    const message =
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured."
        ? "Vision service is not configured."
        : error instanceof Error &&
            error.message === "Gemini vision returned empty content."
          ? "No readable text found in the file."
          : "Failed to extract text from file.";

    const status =
      error instanceof Error &&
      error.message === "GEMINI_API_KEY is not configured."
        ? 503
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}