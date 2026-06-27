import type { ModelProvider } from "@/lib/admin/models";
import type { ModelSelection } from "@/lib/admin/types";
import type { Locale } from "@/lib/config";

import { extractTextWithGeminiVision } from "./gemini-vision";
import type { VisionExtractResult } from "./types";

const OCR_PROMPT =
  "Extract all text from this document image or PDF. Preserve structure (headings, tables, lists). Format response as:\n---TEKS---\n(full text)\n---RINGKASAN---\n(brief summary)";

function parseVisionResponse(raw: string): {
  extractedText: string;
  summary: string;
} {
  const textMatch = raw.match(/---TEKS---\s*([\s\S]*?)(?:---RINGKASAN---|$)/i);
  const summaryMatch = raw.match(/---RINGKASAN---\s*([\s\S]*?)$/i);

  const extractedText = textMatch?.[1]?.trim() || raw.trim();
  const summary = summaryMatch?.[1]?.trim() || extractedText.slice(0, 280);

  return { extractedText, summary };
}

function inferFileType(mimeType: string): VisionExtractResult["fileType"] {
  return mimeType === "application/pdf" ? "pdf" : "image";
}

async function extractWithGroqVision(options: {
  data: string;
  mimeType: string;
  fileName: string;
  locale: Locale;
  modelId: string;
}): Promise<VisionExtractResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const dataUrl = `data:${options.mimeType};base64,${options.data}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.modelId,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Groq vision failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawText = payload.choices?.[0]?.message?.content ?? "";
  if (!rawText.trim()) throw new Error("Groq vision returned empty content.");

  const { extractedText, summary } = parseVisionResponse(rawText);

  return {
    extractedText,
    summary,
    fileType: inferFileType(options.mimeType),
    fileName: options.fileName,
  };
}

async function extractWithHuggingFaceVision(options: {
  data: string;
  mimeType: string;
  fileName: string;
  modelId: string;
}): Promise<VisionExtractResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY is not configured.");

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${options.modelId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          image: `data:${options.mimeType};base64,${options.data}`,
          text: OCR_PROMPT,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HF vision failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as
    | { generated_text?: string }
    | Array<{ generated_text?: string }>;

  const rawText = Array.isArray(payload)
    ? (payload[0]?.generated_text ?? "")
    : (payload.generated_text ?? "");

  if (!rawText.trim()) throw new Error("HF vision returned empty content.");

  const { extractedText, summary } = parseVisionResponse(rawText);

  return {
    extractedText,
    summary,
    fileType: inferFileType(options.mimeType),
    fileName: options.fileName,
  };
}

export async function extractVisionWithConfig(options: {
  data: string;
  mimeType: string;
  fileName: string;
  locale: Locale;
  visionModel: ModelSelection;
}): Promise<VisionExtractResult> {
  const { visionModel } = options;

  switch (visionModel.provider as ModelProvider) {
    case "google":
      return extractTextWithGeminiVision({
        ...options,
        modelId: visionModel.id,
      });
    case "groq":
      return extractWithGroqVision({
        ...options,
        modelId: visionModel.id,
      });
    case "huggingface":
      return extractWithHuggingFaceVision({
        data: options.data,
        mimeType: options.mimeType,
        fileName: options.fileName,
        modelId: visionModel.id,
      });
    default:
      throw new Error(
        `Vision provider "${visionModel.provider}" is not supported.`,
      );
  }
}