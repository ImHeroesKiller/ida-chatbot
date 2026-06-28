import type { Locale } from "@/lib/config";

export const WORKSHEET_START_MARKER = "<<<IDA_WORKSHEET>>>";
export const WORKSHEET_END_MARKER = "<<<END_IDA_WORKSHEET>>>";

export type WorksheetErrorCode =
  | "parse_failed"
  | "empty_document"
  | "generate_failed";

export type WorksheetParseSource =
  | "markers"
  | "partial_marker"
  | "json_block"
  | "markdown_heuristic";

export type WorksheetVersionSource = "generated" | "manual_save" | "restored";

export interface WorksheetVersion {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  source: WorksheetVersionSource;
}

export interface WorksheetDocument {
  title: string;
  content: string;
  updatedAt: number;
  error?: WorksheetErrorCode;
  versions?: WorksheetVersion[];
}

export const MAX_WORKSHEET_VERSIONS = 20;

export interface WorksheetPayload {
  title: string;
  content: string;
}

export interface WorksheetParseResult {
  chatMessage: string;
  worksheet: WorksheetPayload | null;
  parseSource?: WorksheetParseSource;
  error?: WorksheetErrorCode;
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

const WORKSHEET_PARSE_ERROR_CHAT: Record<Locale, string> = {
  id: "Dokumen tidak dapat diproses. Coba kirim ulang permintaan atau perjelas format yang diinginkan.",
  en: "The document could not be processed. Try sending your request again or clarify the format you need.",
  zh: "无法处理文档。请重新发送请求或说明您需要的格式。",
};

export function createWorksheetVersion(params: {
  title: string;
  content: string;
  source: WorksheetVersionSource;
}): WorksheetVersion {
  return {
    id: `wv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: params.title.trim(),
    content: params.content,
    createdAt: Date.now(),
    source: params.source,
  };
}

export function shouldRecordWorksheetVersion(
  versions: WorksheetVersion[] | undefined,
  title: string,
  content: string,
): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const latest = versions?.[0];
  if (!latest) return true;

  return latest.content !== content || latest.title.trim() !== title.trim();
}

export function pushWorksheetVersion(
  versions: WorksheetVersion[] | undefined,
  version: WorksheetVersion,
): WorksheetVersion[] {
  return [version, ...(versions ?? [])].slice(0, MAX_WORKSHEET_VERSIONS);
}

export function recordWorksheetVersion(
  versions: WorksheetVersion[] | undefined,
  params: {
    title: string;
    content: string;
    source: WorksheetVersionSource;
  },
): WorksheetVersion[] {
  if (!shouldRecordWorksheetVersion(versions, params.title, params.content)) {
    return versions ?? [];
  }

  return pushWorksheetVersion(
    versions,
    createWorksheetVersion(params),
  );
}

export function findWorksheetVersion(
  versions: WorksheetVersion[] | undefined,
  versionId: string,
): WorksheetVersion | undefined {
  return versions?.find((version) => version.id === versionId);
}

export function formatWorksheetVersionTime(
  timestamp: number,
  locale: Locale,
): string {
  return new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(timestamp));
}

export function worksheetVersionPreview(content: string, maxLength = 72): string {
  const line =
    content
      .split("\n")
      .map((part) => part.trim())
      .find(Boolean) ?? "";

  const plain = line.replace(/^#+\s*/, "");
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1)}…`;
}

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

function buildWorksheetPayload(
  content: string,
  locale: Locale,
): WorksheetPayload | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  return {
    title: extractWorksheetTitle(trimmed, locale),
    content: trimmed,
  };
}

function stripWorksheetFromChat(
  fullText: string,
  worksheetBlock: string,
  locale: Locale,
): string {
  const withoutBlock = fullText.replace(worksheetBlock, "").trim();
  return withoutBlock || WORKSHEET_CHAT_FALLBACK[locale];
}

function parseWithMarkers(fullText: string, locale: Locale): WorksheetParseResult | null {
  const pattern = new RegExp(
    `${escapeRegExp(WORKSHEET_START_MARKER)}\\s*([\\s\\S]*?)\\s*${escapeRegExp(WORKSHEET_END_MARKER)}`,
  );
  const match = fullText.match(pattern);
  if (!match) return null;

  const worksheetContent = match[1]?.trim() ?? "";
  const chatMessage = stripWorksheetFromChat(fullText, match[0], locale);

  if (!worksheetContent) {
    return { chatMessage, worksheet: null, parseSource: "markers", error: "empty_document" };
  }

  return {
    chatMessage,
    worksheet: buildWorksheetPayload(worksheetContent, locale),
    parseSource: "markers",
  };
}

function parseWithPartialMarker(
  fullText: string,
  locale: Locale,
): WorksheetParseResult | null {
  const startIdx = fullText.indexOf(WORKSHEET_START_MARKER);
  if (startIdx < 0) return null;

  let remainder = fullText.slice(startIdx + WORKSHEET_START_MARKER.length);
  const endIdx = remainder.indexOf(WORKSHEET_END_MARKER);
  if (endIdx >= 0) {
    remainder = remainder.slice(0, endIdx);
  }

  const worksheetContent = remainder.trim();
  const chatMessage = stripWorksheetFromChat(
    fullText,
    fullText.slice(startIdx),
    locale,
  );

  if (!worksheetContent) {
    return {
      chatMessage,
      worksheet: null,
      parseSource: "partial_marker",
      error: "empty_document",
    };
  }

  return {
    chatMessage,
    worksheet: buildWorksheetPayload(worksheetContent, locale),
    parseSource: "partial_marker",
  };
}

function parseWithJsonBlock(
  fullText: string,
  locale: Locale,
): WorksheetParseResult | null {
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonBlockPattern.exec(fullText)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const content =
        typeof parsed.content === "string"
          ? parsed.content
          : typeof parsed.markdown === "string"
            ? parsed.markdown
            : typeof parsed.body === "string"
              ? parsed.body
              : null;

      if (!content?.trim()) continue;

      const title =
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 120)
          : extractWorksheetTitle(content, locale);

      const chatMessage = fullText.replace(match[0], "").trim() || WORKSHEET_CHAT_FALLBACK[locale];

      return {
        chatMessage,
        worksheet: { title, content: content.trim() },
        parseSource: "json_block",
      };
    } catch {
      continue;
    }
  }

  return null;
}

function looksLikeMarkdownDocument(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("#")) return false;

  const lines = trimmed.split("\n").filter((line) => line.trim());
  if (lines.length < 3) return false;

  const hasStructure = lines.some((line) =>
    /^#{1,3}\s+/.test(line.trim()),
  );
  const hasBody = trimmed.length >= 80;

  return hasStructure && hasBody;
}

function parseWithMarkdownHeuristic(
  fullText: string,
  locale: Locale,
): WorksheetParseResult | null {
  const headingMatch = fullText.match(/(^|\n)(#\s+[\s\S]+)/);
  if (!headingMatch?.[2]) return null;

  const worksheetContent = headingMatch[2].trim();
  if (!looksLikeMarkdownDocument(worksheetContent)) return null;

  const blockStart = fullText.indexOf(worksheetContent);
  const chatMessage =
    fullText.slice(0, blockStart).trim() || WORKSHEET_CHAT_FALLBACK[locale];

  return {
    chatMessage,
    worksheet: buildWorksheetPayload(worksheetContent, locale),
    parseSource: "markdown_heuristic",
  };
}

export function parseWorksheetFromResponse(
  fullText: string,
  locale: Locale,
): WorksheetParseResult {
  const trimmed = fullText.trim();
  if (!trimmed) {
    return {
      chatMessage: WORKSHEET_PARSE_ERROR_CHAT[locale],
      worksheet: null,
      error: "empty_document",
    };
  }

  const strategies: Array<(text: string, loc: Locale) => WorksheetParseResult | null> = [
    parseWithMarkers,
    parseWithPartialMarker,
    parseWithJsonBlock,
    parseWithMarkdownHeuristic,
  ];

  for (const strategy of strategies) {
    const result = strategy(trimmed, locale);
    if (result?.worksheet) {
      return result;
    }
    if (result?.error === "empty_document") {
      return result;
    }
  }

  return {
    chatMessage: WORKSHEET_PARSE_ERROR_CHAT[locale],
    worksheet: null,
    error: "parse_failed",
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