import { IDA_CONFIG, type Locale } from "@/lib/config";

import type { VisionExtractResult, VisionFileType } from "./types";

const EXTRACTION_PROMPTS: Record<Locale, string> = {
  id: `Kamu adalah asisten OCR dan analisis dokumen IDA.

Tugas:
1. Ekstrak SEMUA teks yang terbaca dari file (foto, scan, screenshot, atau PDF).
2. Untuk PDF multi-halaman: proses setiap halaman, pisahkan dengan "--- Halaman N ---".
3. Pertahankan struktur: paragraf, heading, bullet/numbered list, tabel (format baris dengan |), label form, dan urutan baca.
4. Jika ada teks tangan, stempel, watermark, atau teks kecil — tetap ekstrak sebisa mungkin; tandai [tidak terbaca] jika benar-benar tidak jelas.
5. Jangan menerjemahkan; pertahankan bahasa asli dokumen.
6. Berikan ringkasan 2-3 kalimat tentang jenis dokumen dan isi utamanya.

Format jawaban WAJIB:
---TEKS---
(teks lengkap hasil ekstraksi)
---RINGKASAN---
(ringkasan singkat dalam Bahasa Indonesia)`,
  en: `You are IDA's OCR and document analysis assistant.

Tasks:
1. Extract ALL readable text from the file (photo, scan, screenshot, or PDF).
2. For multi-page PDFs: process every page and separate sections with "--- Page N ---".
3. Preserve structure: paragraphs, headings, bullet/numbered lists, tables (row format with |), form labels, and reading order.
4. For handwriting, stamps, watermarks, or small text — extract as much as possible; mark [illegible] when truly unclear.
5. Do not translate; keep the document's original language.
6. Provide a 2-3 sentence summary of document type and main content.

Response format MUST be:
---TEKS---
(full extracted text)
---RINGKASAN---
(brief summary in English)`,
  zh: `你是 IDA 的 OCR 和文档分析助手。

任务：
1. 提取文件中所有可读文本（照片、扫描件、截图或 PDF）。
2. 多页 PDF：处理每一页，用 "--- 第 N 页 ---" 分隔。
3. 保留结构：段落、标题、列表、表格（用 | 分隔行）、表单标签和阅读顺序。
4. 手写、印章、水印或小字——尽量提取；确实无法辨认时标注 [无法辨认]。
5. 不要翻译；保留文档原文语言。
6. 用 2-3 句话概括文档类型和主要内容。

回复格式必须为：
---TEKS---
（完整提取文本）
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