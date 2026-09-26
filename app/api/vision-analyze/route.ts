import { NextResponse } from "next/server";
import { z } from "zod";

import { loadAppConfig } from "@/lib/admin/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";

const MAX_IMAGE_BASE64 = 3_500_000;
const MAX_IMAGES = 4;

const requestSchema = z.object({
  prompt: z.string().max(8000).optional().default(""),
  locale: z.enum(["id", "en", "zh"]).optional().default("id"),
  sessionId: z.string().min(8).max(64).optional(),
  images: z
    .array(
      z.object({
        data: z.string().min(1).max(MAX_IMAGE_BASE64),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        fileName: z.string().min(1).max(255).optional(),
      }),
    )
    .min(1)
    .max(MAX_IMAGES),
});

function systemPrompt(locale: "id" | "en" | "zh", userPrompt: string) {
  const instruction =
    locale === "en"
      ? "Answer in English unless the user explicitly asks for another language."
      : locale === "zh"
        ? "除非用户明确要求其他语言，否则请用中文回答。"
        : "Jawab dalam Bahasa Indonesia kecuali pengguna secara eksplisit meminta bahasa lain.";

  return [
    "You are IDA's dedicated multimodal vision runtime.",
    "Inspect the actual image pixels directly. Do not infer visual facts from filenames, URLs, OCR, or prior text.",
    "Describe the full image relevant to the user's request: objects, scene, layout, visible text, spatial relationships, and notable details.",
    "For text, numbers, plates, labels, or documents, read them from the image itself and state uncertainty when a character is ambiguous.",
    "Never mention OCR pipelines, runtime confirmation, or internal implementation details.",
    "Do not reduce a broad image-description request to text extraction only.",
    instruction,
    "",
    "User request:",
    userPrompt.trim() || "Jelaskan gambar ini secara akurat dan menyeluruh berdasarkan apa yang benar-benar terlihat.",
  ].join("\n");
}

async function analyzeWithGemini(options: {
  modelId: string;
  apiKey: string;
  prompt: string;
  images: Array<{ data: string; mimeType: string }>;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.modelId}:generateContent?key=${options.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: options.prompt },
              ...options.images.map((image) => ({
                inline_data: {
                  mime_type: image.mimeType,
                  data: image.data,
                },
              })),
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini multimodal failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) throw new Error("Gemini multimodal returned empty content.");
  return text;
}

async function analyzeWithGroq(options: {
  modelId: string;
  apiKey: string;
  prompt: string;
  images: Array<{ data: string; mimeType: string }>;
}) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: options.prompt },
            ...options.images.map((image) => ({
              type: "image_url",
              image_url: {
                url: `data:${image.mimeType};base64,${image.data}`,
              },
            })),
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq multimodal failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Groq multimodal returned empty content.");
  return text;
}

export async function GET() {
  const config = await loadAppConfig({ bypassCache: true });
  const selected = config.visionModel;
  return NextResponse.json({
    ok: true,
    runtime: "dedicated-multimodal",
    selected,
    providers: {
      google: Boolean(process.env.GEMINI_API_KEY?.trim()),
      groq: Boolean(process.env.GROQ_API_KEY?.trim()),
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid multimodal vision payload." }, { status: 400 });
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: parsed.data.sessionId })}:vision-multimodal`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSec) } },
      );
    }
    throw error;
  }

  const config = await loadAppConfig();
  const selected = config.visionModel;
  const prompt = systemPrompt(parsed.data.locale, parsed.data.prompt);
  const images = parsed.data.images.map((image) => ({
    data: image.data,
    mimeType: image.mimeType,
  }));

  try {
    if (selected.provider === "google") {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
      const analysis = await analyzeWithGemini({
        modelId: selected.id,
        apiKey,
        prompt,
        images,
      });
      return NextResponse.json({
        analysis,
        provider: "google",
        model: selected.id,
        runtime: "dedicated-multimodal",
      });
    }

    if (selected.provider === "groq") {
      const apiKey = process.env.GROQ_API_KEY?.trim();
      if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");
      const analysis = await analyzeWithGroq({
        modelId: selected.id,
        apiKey,
        prompt,
        images,
      });
      return NextResponse.json({
        analysis,
        provider: "groq",
        model: selected.id,
        runtime: "dedicated-multimodal",
      });
    }

    const googleKey = process.env.GEMINI_API_KEY?.trim();
    if (googleKey) {
      const fallbackModel = "gemini-2.5-flash";
      const analysis = await analyzeWithGemini({
        modelId: fallbackModel,
        apiKey: googleKey,
        prompt,
        images,
      });
      return NextResponse.json({
        analysis,
        provider: "google",
        model: fallbackModel,
        runtime: "dedicated-multimodal-fallback",
      });
    }

    return NextResponse.json(
      { error: "No dedicated multimodal provider is configured." },
      { status: 503 },
    );
  } catch (error) {
    console.error("[IDA dedicated multimodal vision]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dedicated multimodal vision failed.",
      },
      { status: 502 },
    );
  }
}
