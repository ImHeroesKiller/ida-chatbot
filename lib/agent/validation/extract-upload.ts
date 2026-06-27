import type { Locale } from "@/lib/config";
import { extractDocumentText } from "@/lib/rag/extract-document";
import type { KbFileType } from "@/lib/rag/kb-types";

import { validateDocumentRules } from "./document-validator";
import type { AgentFileType } from "../types";

const MAX_EXTRACT_CHARS = 12_000;
const MAX_PREVIEW_CHARS = 600;

export function detectAgentFileType(
  fileName: string,
  mimeType?: string,
): AgentFileType | null {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (
    lower.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (
    lower.endsWith(".xlsx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "xlsx";
  }

  return null;
}

function truncateText(text: string, max = MAX_EXTRACT_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[...truncated for analysis...]`;
}

function toPreview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_PREVIEW_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_PREVIEW_CHARS)}…`;
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const { default: XLSX } = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames.slice(0, 5)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) {
      sheets.push(`## Sheet: ${sheetName}\n${csv}`);
    }
  }

  const text = sheets.join("\n\n").trim();
  if (!text) throw new Error("No readable data found in the XLSX file.");
  return text;
}

export async function extractAgentDocumentText(options: {
  buffer: Buffer;
  fileName: string;
  fileType: AgentFileType;
  locale: Locale;
}): Promise<{ fullText: string; preview: string }> {
  const { buffer, fileName, fileType, locale } = options;

  let fullText: string;

  if (fileType === "xlsx") {
    fullText = await extractXlsxText(buffer);
  } else {
    const kbType = fileType as KbFileType;
    fullText = await extractDocumentText({
      buffer,
      fileName,
      fileType: kbType,
      locale,
    });
  }

  fullText = truncateText(fullText);
  return { fullText, preview: toPreview(fullText) };
}

export function validateExtractedDocument(options: {
  fileName: string;
  fileType: AgentFileType;
  text: string;
}) {
  const result = validateDocumentRules(options);
  const notes = [...result.notes];

  if (options.text.includes("[...truncated")) {
    notes.push(
      `${options.fileName}: dokumen dipotong untuk analisis — bagian awal digunakan.`,
    );
  }

  return {
    status: result.status,
    notes,
    category: result.category,
    mandatoryFieldsFound: result.mandatoryFieldsFound,
    mandatoryFieldsMissing: result.mandatoryFieldsMissing,
  };
}

