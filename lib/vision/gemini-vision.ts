import { IDA_CONFIG, type Locale } from "@/lib/config";

import type { VisionExtractResult, VisionFileType } from "./types";

const EXTRACTION_PROMPTS: Record<Locale, string> = {
  id: `Kamu adalah asisten OCR dan analisis dokumen IDA.
Ekstrak SEMUA teks yang terbaca dari file ini (gambar atau PDF).
Kemudian berikan ringkasan singkat (2-3 kalimat) tentang isi dokumen.

Format jawaban WAJIB seperti ini:
---TEKS---
(teks lengkap hasil ekstraksi, pertahankan struktur jika memungkinkan)
---RINGKASAN---
(ringkasan singkat dalam Bahasa Indonesia)`,
  en: `You are IDA's OCR and document analysis assistant.
Extract ALL readable text from this file (image or PDF).
Then provide a brief summary (2-3 sentences) of the document content.

Response format MUST be:
---TEKS---
(full extracted text, preserve structure when possible)
---RINGKASAN---
(brief summary in English)`,
  zh: `你是 IDA 的 OCR 和文档分析助手。
提取此文件（图片或 PDF）中所有可读文本。
然后提供简短摘要（2-3 句）。

回复格式必须为：
---TEKS---
（完整提取文本，尽可能保留结构）
---RINGKASAN---
（中文简短摘要）`,
};

function inferFileType(mimeType: string): VisionFileType {
  if (mimeType === "application/pdf") return "pdf";
  return "image";
}

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

export async function extractTextWithGeminiVision(options: {
  data: string;
  mimeType: string;
  fileName: string;
  locale: Locale;
}): Promise<VisionExtractResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const fileType = inferFileType(options.mimeType);
  const prompt = EXTRACTION_PROMPTS[options.locale];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IDA_CONFIG.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: options.mimeType,
                  data: options.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Gemini vision failed (${response.status}): ${errorBody.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const rawText =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";

  if (!rawText.trim()) {
    throw new Error("Gemini vision returned empty content.");
  }

  const { extractedText, summary } = parseVisionResponse(rawText);

  return {
    extractedText,
    summary,
    fileType,
    fileName: options.fileName,
  };
}