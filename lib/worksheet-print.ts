import type { Locale } from "@/lib/config";
import { stripInlineMarkdown } from "@/lib/pdf-export";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

export function formatPrintExportDate(locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID",
    { dateStyle: "long" },
  ).format(new Date());
}

export function markdownToPrintHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = Math.min(headingMatch[1].length, 6);
      parts.push(
        `<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`,
      );
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(
        `<li>${inlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""))}</li>`,
      );
      continue;
    }

    closeList();
    parts.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return parts.join("\n");
}

export function buildPrintPreviewDocumentHtml(params: {
  title: string;
  content: string;
  brandName: string;
  locale: Locale;
}): string {
  const title = stripInlineMarkdown(params.title.trim() || "Document");
  const body = markdownToPrintHtml(params.content.trim());
  const date = formatPrintExportDate(params.locale);

  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm 16mm; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #181818;
      line-height: 1.65;
      font-size: 14px;
      margin: 0;
      padding: 0;
    }
    .print-header, .print-footer {
      color: #666;
      font-size: 11px;
      border-color: #ddd;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
      margin-bottom: 24px;
    }
    .print-header strong { color: #333; }
    .print-footer {
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
    }
    h1 { font-size: 24px; margin: 0 0 16px; }
    h2 { font-size: 18px; margin: 20px 0 10px; }
    h3 { font-size: 15px; margin: 16px 0 8px; }
    p { margin: 0 0 10px; }
    ul { margin: 8px 0 12px 20px; padding: 0; }
    li { margin: 4px 0; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: #f4f4f4;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 0.92em;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <strong>${escapeHtml(params.brandName)}</strong>
    <span>${escapeHtml(title)}</span>
  </div>
  <main>${body}</main>
  <div class="print-footer">
    <span>${escapeHtml(date)}</span>
    <span>${escapeHtml(params.brandName)} Worksheet</span>
  </div>
</body>
</html>`;
}

export function openWorksheetPrintPreview(params: {
  title: string;
  content: string;
  brandName: string;
  locale: Locale;
}): void {
  const html = buildPrintPreviewDocumentHtml(params);
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");

  if (!printWindow) {
    throw new Error("Popup blocked");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  printWindow.onload = () => {
    printWindow.print();
  };
}