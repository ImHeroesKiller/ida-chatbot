import type { Locale } from "@/lib/config";
import type { IdaAttachment } from "@/lib/types";

const LABELS: Record<
  Locale,
  { summary: string; extracted: string; image: string; pdf: string }
> = {
  id: {
    summary: "Ringkasan dokumen",
    extracted: "Teks diekstrak",
    image: "Gambar",
    pdf: "PDF",
  },
  en: {
    summary: "Document summary",
    extracted: "Extracted text",
    image: "Image",
    pdf: "PDF",
  },
  zh: {
    summary: "文档摘要",
    extracted: "提取文本",
    image: "图片",
    pdf: "PDF",
  },
};

export function buildAttachmentMessageContent(
  userText: string,
  attachment: IdaAttachment,
  locale: Locale,
): string {
  const labels = LABELS[locale];
  const typeLabel = attachment.type === "pdf" ? labels.pdf : labels.image;
  const sections: string[] = [];

  if (userText.trim()) sections.push(userText.trim());

  sections.push(`[${typeLabel}: ${attachment.fileName}]`);

  if (attachment.summary) {
    sections.push(`${labels.summary}: ${attachment.summary}`);
  }

  if (attachment.extractedText) {
    sections.push(`${labels.extracted}:\n${attachment.extractedText}`);
  }

  return sections.join("\n\n");
}