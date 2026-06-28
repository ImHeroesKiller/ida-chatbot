import { jsPDF } from "jspdf";

import type { Locale } from "@/lib/config";
import {
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
  type WorksheetBrandingFontFamily,
} from "@/lib/worksheet-branding-config";
import {
  brandingAddressLines,
  brandingContactLines,
  buildFooterSummary,
  computePdfHeaderZoneMm,
  hexToRgb,
} from "@/lib/worksheet-letterhead";
import {
  WORKSHEET_PRINT_BLOCKQUOTE,
  WORKSHEET_PRINT_BODY,
  WORKSHEET_PRINT_CODE,
  WORKSHEET_PRINT_HR,
  WORKSHEET_PRINT_LIST,
  WORKSHEET_PRINT_MARGIN_MM,
  WORKSHEET_PRINT_TABLE,
  worksheetPrintHeadingForPdf,
} from "@/lib/worksheet-print-typography";

export type PdfPaperFormat = "a4" | "letter";
export type PdfOrientation = "portrait" | "landscape";

export interface PdfBrandingOptions extends Partial<WorksheetBrandingConfig> {
  enabled?: boolean;
  showPageNumbers?: boolean;
  showExportDate?: boolean;
  locale?: Locale;
}

type ResolvedPdfBranding = WorksheetBrandingConfig & {
  enabled: boolean;
  showPageNumbers: boolean;
  showExportDate: boolean;
  locale: Locale;
};

function resolvePdfBranding(
  branding: PdfBrandingOptions | undefined,
): ResolvedPdfBranding {
  const parsed = parseWorksheetBrandingConfig(branding ?? {});

  return {
    ...parsed,
    enabled: branding?.enabled !== false,
    showPageNumbers: branding?.showPageNumbers !== false,
    showExportDate: branding?.showExportDate !== false,
    locale: branding?.locale ?? "en",
  };
}

function pdfFontFamily(family: WorksheetBrandingFontFamily): string {
  switch (family) {
    case "serif":
      return "times";
    case "sans":
      return "helvetica";
    default:
      return "helvetica";
  }
}

export interface WorksheetPdfExportOptions {
  title: string;
  content: string;
  filename?: string;
  paper?: PdfPaperFormat;
  orientation?: PdfOrientation;
  branding?: PdfBrandingOptions;
}

type MarkdownBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullet_list"; items: string[] }
  | { kind: "ordered_list"; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "code"; text: string }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "hr" };

// Typography tokens live in worksheet-print-typography.ts — keep PDF aligned with Full View.
const MARGIN_MM = WORKSHEET_PRINT_MARGIN_MM;
const FOOTER_ZONE_MM = 12;
const CELL_PADDING_MM = WORKSHEET_PRINT_TABLE.cellPaddingMm;
const PT_TO_MM = 0.352778;
const LOGO_MAX_HEIGHT_MM = 8;
const LOGO_MAX_WIDTH_MM = 22;

export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .trim();
}

function parseTableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return null;

  const normalized = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => stripInlineMarkdown(cell.trim()));
}

function isTableSeparator(line: string): boolean {
  const cells = parseTableCells(line);
  if (!cells?.length) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];

  let index = 0;
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushParagraph = (buffer: string[]) => {
    const text = buffer.join(" ").trim();
    if (text) blocks.push({ kind: "paragraph", text: stripInlineMarkdown(text) });
    buffer.length = 0;
  };

  const paragraphBuffer: string[] = [];

  while (index < lines.length) {
    const rawLine = lines[index] ?? "";
    const trimmed = rawLine.trim();

    if (inCode) {
      if (trimmed.startsWith("```")) {
        blocks.push({ kind: "code", text: codeBuffer.join("\n") });
        codeBuffer = [];
        inCode = false;
      } else {
        codeBuffer.push(rawLine);
      }
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph(paragraphBuffer);
      inCode = true;
      index += 1;
      continue;
    }

    if (!trimmed) {
      flushParagraph(paragraphBuffer);
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(paragraphBuffer);
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length,
        text: stripInlineMarkdown(headingMatch[2]),
      });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph(paragraphBuffer);
      blocks.push({ kind: "hr" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph(paragraphBuffer);
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index]?.trim().startsWith(">")) {
        quoteLines.push(
          stripInlineMarkdown(lines[index]!.trim().replace(/^>\s?/, "")),
        );
        index += 1;
      }
      blocks.push({ kind: "blockquote", lines: quoteLines });
      continue;
    }

    const tableCells = parseTableCells(trimmed);
    if (tableCells && index + 1 < lines.length && isTableSeparator(lines[index + 1] ?? "")) {
      flushParagraph(paragraphBuffer);
      const headers = tableCells;
      index += 2;
      const rows: string[][] = [];

      while (index < lines.length) {
        const rowCells = parseTableCells(lines[index] ?? "");
        if (!rowCells) break;
        rows.push(rowCells);
        index += 1;
      }

      blocks.push({ kind: "table", headers, rows });
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph(paragraphBuffer);
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index]?.trim() ?? "")) {
        items.push(
          stripInlineMarkdown(
            (lines[index] ?? "").trim().replace(/^[-*+]\s+/, ""),
          ),
        );
        index += 1;
      }
      blocks.push({ kind: "bullet_list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph(paragraphBuffer);
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index]?.trim() ?? "")) {
        items.push(
          stripInlineMarkdown(
            (lines[index] ?? "").trim().replace(/^\d+\.\s+/, ""),
          ),
        );
        index += 1;
      }
      blocks.push({ kind: "ordered_list", items });
      continue;
    }

    paragraphBuffer.push(trimmed);
    index += 1;
  }

  flushParagraph(paragraphBuffer);

  if (inCode && codeBuffer.length) {
    blocks.push({ kind: "code", text: codeBuffer.join("\n") });
  }

  return blocks;
}

export function formatPdfExportDate(locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID",
    { dateStyle: "medium" },
  ).format(new Date());
}

export function formatPdfPageLabel(
  page: number,
  total: number,
  locale: Locale,
): string {
  if (locale === "zh") return `第 ${page} / ${total} 页`;
  if (locale === "en") return `Page ${page} of ${total}`;
  return `Halaman ${page} dari ${total}`;
}

function detectPdfImageFormat(
  dataUrl: string,
): "PNG" | "JPEG" | "WEBP" | "GIF" {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) {
    return "JPEG";
  }
  if (dataUrl.includes("image/webp")) return "WEBP";
  if (dataUrl.includes("image/gif")) return "GIF";
  return "PNG";
}

export function buildWorksheetPdfFilename(title: string): string {
  const slug =
    title
      .trim()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 60) || "worksheet";

  const date = new Date().toISOString().slice(0, 10);
  return `${slug}-${date}.pdf`;
}

class WorksheetPdfRenderer {
  private readonly pdf: jsPDF;
  private y: number;
  private readonly margin = MARGIN_MM;
  private readonly marginTop: number;
  private readonly headerZoneMm: number;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly contentWidth: number;
  private readonly branding: ResolvedPdfBranding;

  constructor(private readonly options: WorksheetPdfExportOptions) {
    this.pdf = new jsPDF({
      orientation: options.orientation ?? "portrait",
      unit: "mm",
      format: options.paper ?? "a4",
    });

    this.branding = resolvePdfBranding(options.branding);
    this.headerZoneMm = this.branding.enabled
      ? computePdfHeaderZoneMm(this.branding)
      : 0;

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.marginTop = this.margin + this.headerZoneMm;
    this.y = this.marginTop;
  }

  render(): void {
    const title = stripInlineMarkdown(this.options.title.trim() || "Document");
    this.renderDocumentTitle(title);

    const blocks = parseMarkdownBlocks(this.options.content.trim());
    for (const block of blocks) {
      this.renderBlock(block);
    }

    if (this.branding.enabled) {
      this.applyBrandingToAllPages();
    }
  }

  save(): void {
    const filename =
      this.options.filename ??
      buildWorksheetPdfFilename(this.options.title.trim() || "Document");
    this.pdf.save(filename);
  }

  private pageBottom(): number {
    const footerReserve = this.branding.enabled ? FOOTER_ZONE_MM : 0;
    return this.pageHeight - this.margin - footerReserve;
  }

  private addPage(): void {
    this.pdf.addPage();
    this.y = this.marginTop;
  }

  private applyBrandingToAllPages(): void {
    const totalPages = this.pdf.getNumberOfPages();
    const docTitle = stripInlineMarkdown(
      this.options.title.trim() || "Document",
    );
    const exportDate = formatPdfExportDate(this.branding.locale);
    const footerSummary = buildFooterSummary(this.branding);
    const footerTextY = this.pageHeight - this.margin - 4;
    const footerLineY = this.pageHeight - this.margin - FOOTER_ZONE_MM + 2;
    const primaryRgb = hexToRgb(this.branding.primaryColor);

    for (let page = 1; page <= totalPages; page += 1) {
      this.pdf.setPage(page);
      this.renderPdfPageHeader(docTitle, primaryRgb);
      this.renderPdfPageFooter(
        page,
        totalPages,
        exportDate,
        footerSummary,
        footerTextY,
        footerLineY,
      );
    }

    this.pdf.setTextColor(24, 24, 24);
  }

  private renderPdfPageHeader(
    docTitle: string,
    primaryRgb: { r: number; g: number; b: number },
  ): void {
    const headerFont = pdfFontFamily(this.branding.headerFontFamily);
    let textX = this.margin;
    let textY = this.margin + 4;

    if (this.branding.logoDataUrl) {
      try {
        const format = detectPdfImageFormat(this.branding.logoDataUrl);
        this.pdf.addImage(
          this.branding.logoDataUrl,
          format,
          this.margin,
          this.margin + 1,
          LOGO_MAX_WIDTH_MM,
          LOGO_MAX_HEIGHT_MM,
          undefined,
          "FAST",
        );
        textX = this.margin + LOGO_MAX_WIDTH_MM + 2;
      } catch {
        textX = this.margin;
      }
    }

    this.pdf.setFont(headerFont, "bold");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    this.pdf.text(this.branding.brandName, textX, textY);
    textY += 3.5;

    if (this.branding.tagline.trim()) {
      this.pdf.setFont(headerFont, "italic");
      this.pdf.setFontSize(7.5);
      this.pdf.setTextColor(85, 85, 85);
      const taglineLines = this.pdf.splitTextToSize(
        this.branding.tagline.trim(),
        this.contentWidth * 0.55,
      ) as string[];
      for (const line of taglineLines.slice(0, 2)) {
        this.pdf.text(line, textX, textY);
        textY += 2.8;
      }
    }

    const addressLines = brandingAddressLines(this.branding.address).slice(0, 3);
    if (addressLines.length > 0) {
      this.pdf.setFont(headerFont, "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(102, 102, 102);
      for (const line of addressLines) {
        this.pdf.text(line, textX, textY);
        textY += 2.5;
      }
    }

    const contactLines = brandingContactLines(this.branding);
    if (contactLines.length > 0) {
      this.pdf.setFont(headerFont, "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(102, 102, 102);
      const contactText = contactLines.join(" · ");
      const wrappedContact = this.pdf.splitTextToSize(
        contactText,
        this.contentWidth * 0.55,
      ) as string[];
      for (const line of wrappedContact.slice(0, 2)) {
        this.pdf.text(line, textX, textY);
        textY += 2.5;
      }
    }

    const truncatedTitle = this.truncateHeaderTitle(docTitle, headerFont);
    this.pdf.setFont(headerFont, "normal");
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(102, 102, 102);
    this.pdf.text(truncatedTitle, this.pageWidth - this.margin, this.margin + 4, {
      align: "right",
    });

    if (this.branding.showHeaderDivider) {
      const dividerY = this.margin + this.headerZoneMm - 1.5;
      this.pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      this.pdf.setLineWidth(0.25);
      this.pdf.line(this.margin, dividerY, this.pageWidth - this.margin, dividerY);
    }
  }

  private renderPdfPageFooter(
    page: number,
    totalPages: number,
    exportDate: string,
    footerSummary: string,
    footerTextY: number,
    footerLineY: number,
  ): void {
    const footerFont = pdfFontFamily(this.branding.footerFontFamily);

    this.pdf.setDrawColor(221, 221, 221);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(
      this.margin,
      footerLineY,
      this.pageWidth - this.margin,
      footerLineY,
    );

    this.pdf.setFont(footerFont, "normal");
    this.pdf.setFontSize(7.5);
    this.pdf.setTextColor(102, 102, 102);

    if (this.branding.showExportDate) {
      this.pdf.text(exportDate, this.margin, footerTextY);
    }

    const rightParts = [footerSummary];
    if (this.branding.showPageNumbers) {
      rightParts.push(
        formatPdfPageLabel(page, totalPages, this.branding.locale),
      );
    }

    const rightLabel = rightParts.filter(Boolean).join(" · ");
    const wrappedRight = this.pdf.splitTextToSize(
      rightLabel,
      this.contentWidth * 0.62,
    ) as string[];
    const rightText = wrappedRight[wrappedRight.length - 1] ?? rightLabel;

    this.pdf.text(rightText, this.pageWidth - this.margin, footerTextY, {
      align: "right",
    });
  }

  private truncateHeaderTitle(title: string, fontFamily: string): string {
    const maxWidth = this.contentWidth * 0.38;
    let truncated = title;

    this.pdf.setFont(fontFamily, "normal");
    this.pdf.setFontSize(8);

    while (
      truncated.length > 1 &&
      (this.pdf.getTextWidth(truncated) as number) > maxWidth
    ) {
      truncated = truncated.slice(0, -1);
    }

    if (truncated !== title) {
      truncated = `${truncated.slice(0, Math.max(0, truncated.length - 1))}…`;
    }

    return truncated;
  }

  private ensureSpace(height: number): void {
    if (this.y + height > this.pageBottom()) {
      this.addPage();
    }
  }

  private lineHeightMm(
    fontSizePt: number,
    factor: number = WORKSHEET_PRINT_BODY.lineHeight,
  ): number {
    return fontSizePt * PT_TO_MM * factor;
  }

  private setTextStyle(
    fontSizePt: number,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
  ): void {
    this.pdf.setFont("helvetica", style);
    this.pdf.setFontSize(fontSizePt);
    this.pdf.setTextColor(24, 24, 24);
  }

  private writeWrappedText(
    text: string,
    fontSizePt: number,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
    maxWidth = this.contentWidth,
    lineHeightFactor: number = WORKSHEET_PRINT_BODY.lineHeight,
  ): void {
    this.setTextStyle(fontSizePt, style);
    const lines = this.pdf.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = this.lineHeightMm(fontSizePt, lineHeightFactor);

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.pdf.text(line, this.margin, this.y);
      this.y += lineHeight;
    }
  }

  private gap(mm: number): void {
    this.y += mm;
  }

  private renderDocumentTitle(title: string): void {
    this.setTextStyle(22, "bold");
    this.writeWrappedText(title, 22, "bold");
    this.gap(2);

    this.pdf.setDrawColor(180, 180, 180);
    this.pdf.setLineWidth(0.3);
    this.ensureSpace(1);
    this.pdf.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.gap(8);
  }

  private renderBlock(block: MarkdownBlock): void {
    switch (block.kind) {
      case "heading":
        this.renderHeading(block.level, block.text);
        break;
      case "paragraph":
        this.writeWrappedText(
          block.text,
          WORKSHEET_PRINT_BODY.fontSizePt,
          "normal",
        );
        this.gap(WORKSHEET_PRINT_BODY.paragraphGapAfterMm);
        break;
      case "bullet_list":
        this.renderBulletList(block.items);
        break;
      case "ordered_list":
        this.renderOrderedList(block.items);
        break;
      case "table":
        this.renderTable(block.headers, block.rows);
        break;
      case "code":
        this.renderCodeBlock(block.text);
        break;
      case "blockquote":
        this.renderBlockquote(block.lines);
        break;
      case "hr":
        this.renderHorizontalRule();
        break;
      default:
        break;
    }
  }

  private renderHeading(level: number, text: string): void {
    const style = worksheetPrintHeadingForPdf(level);
    this.gap(style.gapBefore);
    this.writeWrappedText(
      text,
      style.size,
      "bold",
      this.contentWidth,
      style.lineHeight,
    );
    this.gap(style.gapAfter);
  }

  private renderBulletList(items: string[]): void {
    const fontSize = WORKSHEET_PRINT_LIST.fontSizePt;
    const bulletIndent = WORKSHEET_PRINT_LIST.bulletIndentMm;
    const textWidth = this.contentWidth - bulletIndent;
    const lineHeight = this.lineHeightMm(fontSize);

    for (const item of items) {
      const lines = this.pdf.splitTextToSize(item, textWidth) as string[];
      this.ensureSpace(Math.max(lines.length, 1) * lineHeight + 1);
      this.setTextStyle(fontSize, "normal");
      this.pdf.text("•", this.margin + 1, this.y);

      for (let i = 0; i < lines.length; i += 1) {
        if (i > 0) {
          this.ensureSpace(lineHeight);
        }
        this.pdf.text(lines[i]!, this.margin + bulletIndent, this.y);
        this.y += lineHeight;
      }
      this.gap(WORKSHEET_PRINT_LIST.itemGapAfterMm);
    }
    this.gap(WORKSHEET_PRINT_LIST.blockGapAfterMm);
  }

  private renderOrderedList(items: string[]): void {
    const fontSize = WORKSHEET_PRINT_LIST.fontSizePt;
    const numberIndent = WORKSHEET_PRINT_LIST.orderedIndentMm;
    const textWidth = this.contentWidth - numberIndent;
    const lineHeight = this.lineHeightMm(fontSize);

    items.forEach((item, itemIndex) => {
      const marker = `${itemIndex + 1}.`;
      const lines = this.pdf.splitTextToSize(item, textWidth) as string[];
      this.ensureSpace(Math.max(lines.length, 1) * lineHeight + 1);
      this.setTextStyle(fontSize, "normal");
      this.pdf.text(marker, this.margin, this.y);

      for (let i = 0; i < lines.length; i += 1) {
        if (i > 0) {
          this.ensureSpace(lineHeight);
        }
        this.pdf.text(lines[i]!, this.margin + numberIndent, this.y);
        this.y += lineHeight;
      }
      this.gap(WORKSHEET_PRINT_LIST.itemGapAfterMm);
    });
    this.gap(WORKSHEET_PRINT_LIST.blockGapAfterMm);
  }

  private renderCodeBlock(code: string): void {
    const fontSize = WORKSHEET_PRINT_CODE.blockFontSizePt;
    const lineHeight = this.lineHeightMm(
      fontSize,
      WORKSHEET_PRINT_CODE.lineHeight,
    );
    const lines = code.split("\n");

    this.pdf.setFont("courier", "normal");
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(40, 40, 40);

    for (const line of lines) {
      const wrapped = this.pdf.splitTextToSize(
        line || " ",
        this.contentWidth - CELL_PADDING_MM * 2,
      ) as string[];

      for (const segment of wrapped) {
        this.ensureSpace(lineHeight + 1);
        const blockTop = this.y;
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.setDrawColor(220, 220, 220); // matches WORKSHEET_PRINT_CODE.blockBorderColor
        this.pdf.rect(
          this.margin,
          blockTop,
          this.contentWidth,
          lineHeight + CELL_PADDING_MM,
          "FD",
        );
        this.pdf.text(
          segment,
          this.margin + CELL_PADDING_MM,
          blockTop + lineHeight * 0.9,
        );
        this.y += lineHeight + 1;
      }
    }

    this.gap(WORKSHEET_PRINT_CODE.blockGapAfterMm);
    this.pdf.setTextColor(24, 24, 24);
  }

  private renderBlockquote(lines: string[]): void {
    const fontSize = WORKSHEET_PRINT_BLOCKQUOTE.fontSizePt;
    const indent = WORKSHEET_PRINT_BLOCKQUOTE.indentMm;
    const textWidth = this.contentWidth - indent - 3;
    const text = lines.join(" ");
    const wrapped = this.pdf.splitTextToSize(text, textWidth) as string[];
    const lineHeight = this.lineHeightMm(
      fontSize,
      WORKSHEET_PRINT_BLOCKQUOTE.lineHeight,
    );
    const blockHeight = wrapped.length * lineHeight + 4;

    this.ensureSpace(blockHeight);
    this.pdf.setDrawColor(180, 180, 180); // matches WORKSHEET_PRINT_BLOCKQUOTE.borderColor
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margin, this.y, this.margin, this.y + blockHeight - 2);

    this.setTextStyle(fontSize, "italic");
    for (const line of wrapped) {
      this.pdf.text(line, this.margin + indent, this.y);
      this.y += lineHeight;
    }
    this.gap(WORKSHEET_PRINT_BLOCKQUOTE.blockGapAfterMm);
  }

  private renderHorizontalRule(): void {
    this.gap(WORKSHEET_PRINT_HR.gapBeforeMm);
    this.ensureSpace(2);
    this.pdf.setDrawColor(200, 200, 200); // matches WORKSHEET_PRINT_HR.color
    this.pdf.setLineWidth(0.4);
    this.pdf.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.gap(WORKSHEET_PRINT_HR.gapAfterMm);
  }

  private renderTable(headers: string[], rows: string[][]): void {
    const colCount = Math.max(headers.length, ...rows.map((row) => row.length));
    if (colCount === 0) return;

    const normalizedHeaders = Array.from({ length: colCount }, (_, i) =>
      headers[i] ?? "",
    );
    const normalizedRows = rows.map((row) =>
      Array.from({ length: colCount }, (_, i) => row[i] ?? ""),
    );

    const fontSize = WORKSHEET_PRINT_TABLE.fontSizePt;
    const headerFontSize = WORKSHEET_PRINT_TABLE.headerFontSizePt;
    const lineHeight = this.lineHeightMm(
      fontSize,
      WORKSHEET_PRINT_TABLE.lineHeight,
    );
    const colWidths = this.computeColumnWidths(
      normalizedHeaders,
      normalizedRows,
      colCount,
      fontSize,
    );

    const renderRow = (
      cells: string[],
      isHeader: boolean,
      rowFontSize: number,
      bold: boolean,
    ) => {
      const cellLines = cells.map((cell, colIndex) =>
        this.pdf.splitTextToSize(
          cell || " ",
          colWidths[colIndex]! - CELL_PADDING_MM * 2,
        ) as string[],
      );
      const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
      const rowHeight = maxLines * lineHeight + CELL_PADDING_MM * 2;

      this.ensureSpace(rowHeight);

      if (isHeader) {
        this.pdf.setFillColor(236, 236, 236); // WORKSHEET_PRINT_TABLE.headerBackground
        this.pdf.rect(
          this.margin,
          this.y,
          this.contentWidth,
          rowHeight,
          "F",
        );
      }

      let x = this.margin;
      for (let col = 0; col < colCount; col += 1) {
        const width = colWidths[col]!;
        this.pdf.setDrawColor(190, 190, 190); // WORKSHEET_PRINT_TABLE.borderColor
        this.pdf.setLineWidth(0.2);
        this.pdf.rect(x, this.y, width, rowHeight);

        this.setTextStyle(rowFontSize, bold ? "bold" : "normal");
        let textY = this.y + CELL_PADDING_MM + lineHeight * 0.85;
        for (const line of cellLines[col] ?? []) {
          this.pdf.text(line, x + CELL_PADDING_MM, textY);
          textY += lineHeight;
        }

        x += width;
      }

      this.y += rowHeight;
    };

    renderRow(normalizedHeaders, true, headerFontSize, true);
    for (const row of normalizedRows) {
      renderRow(row, false, fontSize, false);
    }

    this.gap(WORKSHEET_PRINT_TABLE.blockGapAfterMm);
  }

  private computeColumnWidths(
    headers: string[],
    rows: string[][],
    colCount: number,
    fontSize: number,
  ): number[] {
    this.pdf.setFontSize(fontSize);
    const minColWidth = 18;
    const weights = Array.from({ length: colCount }, (_, colIndex) => {
      const samples = [
        headers[colIndex] ?? "",
        ...rows.map((row) => row[colIndex] ?? ""),
      ];
      const maxWidth = Math.max(
        ...samples.map(
          (sample) => (this.pdf.getTextWidth(sample) as number) + 8,
        ),
        minColWidth,
      );
      return maxWidth;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let widths = weights.map(
      (weight) => (weight / totalWeight) * this.contentWidth,
    );

    widths = widths.map((width) => Math.max(width, minColWidth));

    const widthSum = widths.reduce((sum, width) => sum + width, 0);
    if (widthSum > this.contentWidth) {
      const scale = this.contentWidth / widthSum;
      widths = widths.map((width) => width * scale);
    } else if (widthSum < this.contentWidth) {
      const extra = this.contentWidth - widthSum;
      widths[widths.length - 1] = (widths[widths.length - 1] ?? 0) + extra;
    }

    return widths;
  }
}

export async function exportWorksheetToPdf(
  options: WorksheetPdfExportOptions,
): Promise<void> {
  const trimmedContent = options.content.trim();
  if (!trimmedContent) {
    throw new Error("Worksheet content is empty.");
  }

  await Promise.resolve();

  const renderer = new WorksheetPdfRenderer(options);
  renderer.render();
  renderer.save();
}