import mammoth from "mammoth";

import { loadAppConfig } from "@/lib/admin/config";
import type { Locale } from "@/lib/config";
import { extractVisionWithConfig } from "@/lib/vision/vision-service";

import type { KbFileType } from "./kb-types";

const MIME_BY_TYPE: Record<KbFileType, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function detectFileType(fileName: string, mimeType?: string): KbFileType | null {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (lower.endsWith(".txt") || mimeType === "text/plain") return "txt";
  if (lower.endsWith(".md") || mimeType === "text/markdown") return "md";
  if (
    lower.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  return null;
}

export function slugifyFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");

  return (
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "document"
  );
}

async function extractPdfText(
  buffer: Buffer,
  fileName: string,
  locale: Locale,
): Promise<string> {
  const appConfig = await loadAppConfig();
  const data = buffer.toString("base64");

  const result = await extractVisionWithConfig({
    data,
    mimeType: "application/pdf",
    fileName,
    locale,
    visionModel: appConfig.visionModel,
  });

  const text = result.extractedText.trim();
  if (!text) throw new Error("No text could be extracted from the PDF.");

  return text;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();

  if (!text) throw new Error("No text could be extracted from the DOCX file.");

  return text;
}

export async function extractDocumentText(options: {
  buffer: Buffer;
  fileName: string;
  fileType: KbFileType;
  locale: Locale;
}): Promise<string> {
  const { buffer, fileName, fileType, locale } = options;

  switch (fileType) {
    case "txt":
    case "md": {
      const text = buffer.toString("utf8").trim();
      if (!text) throw new Error("The text file is empty.");
      return text;
    }
    case "docx":
      return extractDocxText(buffer);
    case "pdf":
      return extractPdfText(buffer, fileName, locale);
    default:
      throw new Error(`Unsupported file type: ${String(fileType)}`);
  }
}

export function mimeTypeForFileType(fileType: KbFileType): string {
  return MIME_BY_TYPE[fileType];
}