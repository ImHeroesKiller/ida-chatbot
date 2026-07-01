import type { Locale } from "@/lib/config";
import { stripInlineMarkdown } from "@/lib/pdf-export";
import { markdownToRichDocumentHtml } from "@/lib/worksheet-workflow-output";
import type { WorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import {
  buildLetterheadCss,
  buildLetterheadFooterHtml,
  buildLetterheadHeaderHtml,
} from "@/lib/worksheet-letterhead";
import {
  WORKSHEET_PRINT_BODY,
  WORKSHEET_PRINT_MARGIN_MM,
  WORKSHEET_PRINT_PROSE_CSS,
} from "@/lib/worksheet-print-typography";

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
  const rich = markdownToRichDocumentHtml(markdown);
  if (rich) return rich;

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
  branding: WorksheetBrandingConfig;
  locale: Locale;
  pageLabel?: string;
}): string {
  const title = stripInlineMarkdown(params.title.trim() || "Document");
  const body = markdownToPrintHtml(params.content.trim());
  const headerHtml = buildLetterheadHeaderHtml({
    branding: params.branding,
    documentTitle: title,
  });
  const footerHtml = buildLetterheadFooterHtml({
    branding: params.branding,
    locale: params.locale,
    pageLabel: params.pageLabel,
  });

  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: ${WORKSHEET_PRINT_MARGIN_MM}mm; }
    body {
      font-family: ${WORKSHEET_PRINT_BODY.fontFamily};
      color: ${WORKSHEET_PRINT_BODY.color};
      line-height: ${WORKSHEET_PRINT_BODY.lineHeight};
      font-size: ${WORKSHEET_PRINT_BODY.fontSizePt}pt;
      margin: 0;
      padding: 0;
    }
    ${buildLetterheadCss(params.branding)}
    ${WORKSHEET_PRINT_PROSE_CSS}
  </style>
</head>
<body>
  ${headerHtml}
  <main class="worksheet-print-prose">${body}</main>
  ${footerHtml}
</body>
</html>`;
}

export function openWorksheetPrintPreview(params: {
  title: string;
  content: string;
  branding: WorksheetBrandingConfig;
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