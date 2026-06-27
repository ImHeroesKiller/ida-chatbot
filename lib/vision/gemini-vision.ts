import { IDA_CONFIG, type Locale } from "@/lib/config";

import type { VisionExtractResult, VisionFileType } from "./types";

const EXTRACTION_PROMPTS: Record<Locale, string> = {
  id: `Kamu adalah asisten OCR dan analisis dokumen IDA (Gemini Vision).

Tugas:
1. Ekstrak SEMUA teks dari file (foto, scan, screenshot, PDF, faktur, kontrak, formulir).
2. PDF multi-halaman: proses setiap halaman berurutan. Pisahkan dengan:
   --- Halaman 1 ---
   --- Halaman 2 --- (dst.)
3. Struktur dokumen:
   - Heading/judul: baris sendiri, pertahankan hierarki
   - Paragraf: pisahkan baris kosong
   - Bullet/numbered list: pertahankan nomor/penanda
   - Tabel: setiap baris sebagai | kolom1 | kolom2 | ... |, sertakan header jika ada
   - Form/kolom: label: nilai per baris
   - Multi-kolom: baca kiri→kanan, atas→bawah
4. Teks tangan, stempel, watermark, caption gambar — ekstrak sebisa mungkin; [tidak terbaca] jika tidak jelas.
5. Jangan menerjemahkan; pertahankan bahasa asli.
6. Ringkasan 2-3 kalimat: jenis dokumen + isi utama + bahasa dominan.

Format jawaban WAJIB:
---TEKS---
(teks lengkap)
---RINGKASAN---
(ringkasan Bahasa Indonesia)`,
  en: `You are IDA's OCR and document analysis assistant (Gemini Vision).

Tasks:
1. Extract ALL text from the file (photo, scan, screenshot, PDF, invoice, contract, form).
2. Multi-page PDFs: process pages in order. Separate with:
   --- Page 1 ---
   --- Page 2 --- (etc.)
3. Document structure:
   - Headings: own lines, preserve hierarchy
   - Paragraphs: blank line separators
   - Bullet/numbered lists: keep markers/numbers
   - Tables: each row as | col1 | col2 | ... |, include headers when present
   - Forms: label: value per line
   - Multi-column layout: left→right, top→bottom reading order
4. Handwriting, stamps, watermarks, image captions — extract when possible; [illegible] if unclear.
5. Do not translate; keep original language.
6. 2-3 sentence summary: document type + main content + dominant language.

Response format MUST be:
---TEKS---
(full extracted text)
---RINGKASAN---
(brief English summary)`,
  zh: `你是 IDA 的 OCR 和文档分析助手（Gemini Vision）。

任务：
1. 提取文件中所有文本（照片、扫描件、截图、PDF、发票、合同、表单）。
2. 多页 PDF：按顺序处理每一页，用以下分隔：
   --- 第 1 页 ---
   --- 第 2 页 ---（依此类推）
3. 文档结构：
   - 标题：单独成行，保留层级
   - 段落：空行分隔
   - 列表：保留编号/标记
   - 表格：每行 | 列1 | 列2 | ... |，含表头
   - 表单：标签：值，每行一项
   - 多栏排版：从左到右、从上到下阅读
4. 手写、印章、水印、图片说明——尽量提取；不清楚时标注 [无法辨认]。
5. 不要翻译；保留原文语言。
6. 2-3 句摘要：文档类型 + 主要内容 + 主要语言。

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