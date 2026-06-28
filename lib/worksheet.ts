import type { Locale } from "@/lib/config";

export const WORKSHEET_START_MARKER = "<<<IDA_WORKSHEET>>>";
export const WORKSHEET_END_MARKER = "<<<END_IDA_WORKSHEET>>>";

export interface WorksheetDocument {
  title: string;
  content: string;
  updatedAt: number;
}

export interface WorksheetPayload {
  title: string;
  content: string;
}

const DEFAULT_WORKSHEET_TITLES: Record<Locale, string> = {
  id: "Dokumen Baru",
  en: "New Document",
  zh: "新文档",
};

const WORKSHEET_CHAT_FALLBACK: Record<Locale, string> = {
  id: "Dokumen sudah dibuat. Lihat dan salin dari panel Worksheet di sebelah kanan.",
  en: "Your document is ready. View and copy it from the Worksheet panel on the right.",
  zh: "文档已生成。请在右侧 Worksheet 面板查看和复制。",
};

export function createEmptyWorksheet(locale: Locale): WorksheetDocument {
  return {
    title: DEFAULT_WORKSHEET_TITLES[locale],
    content: "",
    updatedAt: Date.now(),
  };
}

export function extractWorksheetTitle(markdown: string, locale: Locale): string {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading?.[1]?.trim()) {
    return heading[1].trim().slice(0, 120);
  }

  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return DEFAULT_WORKSHEET_TITLES[locale];

  return firstLine.replace(/^#+\s*/, "").slice(0, 120);
}

export function parseWorksheetFromResponse(
  fullText: string,
  locale: Locale,
): { chatMessage: string; worksheet: WorksheetPayload | null } {
  const pattern = new RegExp(
    `${escapeRegExp(WORKSHEET_START_MARKER)}\\s*([\\s\\S]*?)\\s*${escapeRegExp(WORKSHEET_END_MARKER)}`,
  );
  const match = fullText.match(pattern);

  if (!match?.[1]) {
    return { chatMessage: fullText.trim(), worksheet: null };
  }

  const worksheetContent = match[1].trim();
  const chatMessage =
    fullText.replace(match[0], "").trim() || WORKSHEET_CHAT_FALLBACK[locale];

  if (!worksheetContent) {
    return { chatMessage, worksheet: null };
  }

  return {
    chatMessage,
    worksheet: {
      title: extractWorksheetTitle(worksheetContent, locale),
      content: worksheetContent,
    },
  };
}

export function buildWorksheetPromptSection(locale: Locale): string {
  const instructions: Record<Locale, string> = {
    id: `## Mode Worksheet (Dokumen Markdown)
Pengguna sedang membuat dokumen melalui panel **Worksheet**.

Aturan respons WAJIB:
1. **Bagian chat (pendek):** 1–3 kalimat yang mengonfirmasi dokumen dibuat dan mengarahkan pengguna ke panel Worksheet. Jangan salin isi dokumen lengkap di bagian chat.
2. **Bagian Worksheet:** Tulis dokumen Markdown lengkap di antara penanda berikut (tanpa teks lain di dalam penanda):

${WORKSHEET_START_MARKER}
# Judul Dokumen Yang Jelas
... isi dokumen markdown lengkap ...
${WORKSHEET_END_MARKER}

Panduan dokumen:
- Gunakan heading (#, ##), bullet, dan struktur yang rapi.
- Judul dokumen WAJIB sebagai baris pertama \`# Judul\` di dalam penanda.
- Sesuaikan format dengan permintaan (proposal, laporan, surat, dsb.).`,
    en: `## Worksheet Mode (Markdown Document)
The user is creating a document via the **Worksheet** panel.

Required response format:
1. **Chat section (short):** 1–3 sentences confirming the document is ready and pointing to the Worksheet panel. Do not paste the full document in chat.
2. **Worksheet section:** Write the full Markdown document between these markers (no extra text inside the markers):

${WORKSHEET_START_MARKER}
# Clear Document Title
... full markdown content ...
${WORKSHEET_END_MARKER}

Document guidelines:
- Use headings (#, ##), bullets, and clear structure.
- The document title MUST be the first line \`# Title\` inside the markers.
- Match the requested format (proposal, report, letter, etc.).`,
    zh: `## Worksheet 模式（Markdown 文档）
用户正在通过 **Worksheet** 面板创建文档。

必须的回复格式：
1. **聊天部分（简短）：** 1–3 句话确认文档已生成，并引导用户查看 Worksheet 面板。不要在聊天中粘贴完整文档。
2. **Worksheet 部分：** 在以下标记之间写入完整 Markdown 文档（标记内不要有多余文字）：

${WORKSHEET_START_MARKER}
# 清晰的文档标题
... 完整 markdown 内容 ...
${WORKSHEET_END_MARKER}

文档指南：
- 使用标题（#、##）、列表和清晰结构。
- 文档标题必须是标记内的第一行 \`# 标题\`。
- 根据请求匹配格式（提案、报告、信函等）。`,
  };

  return instructions[locale];
}

export function sanitizeWorksheetFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  return cleaned || "worksheet";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}