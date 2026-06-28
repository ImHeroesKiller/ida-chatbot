import { jsPDF } from "jspdf";

export type PdfPaperFormat = "a4" | "letter";
export type PdfOrientation = "portrait" | "landscape";

export interface WorksheetPdfExportOptions {
  title: string;
  content: string;
  filename?: string;
  paper?: PdfPaperFormat;
  orientation?: PdfOrientation;
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

const MARGIN_MM = 20;
const CELL_PADDING_MM = 2;
const PT_TO_MM = 0.352778;

const HEADING_STYLES: Record<
  number,
  { size: number; gapBefore: number; gapAfter: number }
> = {
  1: { size: 20, gapBefore: 2, gapAfter: 6 },
  2: { size: 16, gapBefore: 5, gapAfter: 4 },
  3: { size: 13, gapBefore: 4, gapAfter: 3 },
  4: { size: 12, gapBefore: 3, gapAfter: 2.5 },
  5: { size: 11, gapBefore: 2.5, gapAfter: 2 },
  6: { size: 10.5, gapBefore: 2, gapAfter: 2 },
};

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

  let paragraphBuffer: string[] = [];

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
  private y = MARGIN_MM;
  private readonly margin = MARGIN_MM;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly contentWidth: number;

  constructor(private readonly options: WorksheetPdfExportOptions) {
    this.pdf = new jsPDF({
      orientation: options.orientation ?? "portrait",
      unit: "mm",
      format: options.paper ?? "a4",
    });

    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
  }

  render(): void {
    const title = stripInlineMarkdown(this.options.title.trim() || "Document");
    this.renderDocumentTitle(title);

    const blocks = parseMarkdownBlocks(this.options.content.trim());
    for (const block of blocks) {
      this.renderBlock(block);
    }
  }

  save(): void {
    const filename =
      this.options.filename ??
      buildWorksheetPdfFilename(this.options.title.trim() || "Document");
    this.pdf.save(filename);
  }

  private pageBottom(): number {
    return this.pageHeight - this.margin;
  }

  private addPage(): void {
    this.pdf.addPage();
    this.y = this.margin;
  }

  private ensureSpace(height: number): void {
    if (this.y + height > this.pageBottom()) {
      this.addPage();
    }
  }

  private lineHeightMm(fontSizePt: number, factor = 1.45): number {
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
    lineHeightFactor = 1.45,
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
        this.writeWrappedText(block.text, 11, "normal");
        this.gap(3);
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
    const style = HEADING_STYLES[Math.min(level, 6)] ?? HEADING_STYLES[3];
    this.gap(style.gapBefore);
    this.writeWrappedText(text, style.size, "bold", this.contentWidth, 1.3);
    this.gap(style.gapAfter);
  }

  private renderBulletList(items: string[]): void {
    const fontSize = 11;
    const bulletIndent = 5;
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
      this.gap(1);
    }
    this.gap(3);
  }

  private renderOrderedList(items: string[]): void {
    const fontSize = 11;
    const numberIndent = 8;
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
      this.gap(1);
    });
    this.gap(3);
  }

  private renderCodeBlock(code: string): void {
    const fontSize = 9;
    const lineHeight = this.lineHeightMm(fontSize, 1.35);
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
        this.pdf.setDrawColor(220, 220, 220);
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

    this.gap(3);
    this.pdf.setTextColor(24, 24, 24);
  }

  private renderBlockquote(lines: string[]): void {
    const fontSize = 11;
    const indent = 6;
    const textWidth = this.contentWidth - indent - 3;
    const text = lines.join(" ");
    const wrapped = this.pdf.splitTextToSize(text, textWidth) as string[];
    const lineHeight = this.lineHeightMm(fontSize, 1.4);
    const blockHeight = wrapped.length * lineHeight + 4;

    this.ensureSpace(blockHeight);
    this.pdf.setDrawColor(180, 180, 180);
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margin, this.y, this.margin, this.y + blockHeight - 2);

    this.setTextStyle(fontSize, "italic");
    for (const line of wrapped) {
      this.pdf.text(line, this.margin + indent, this.y);
      this.y += lineHeight;
    }
    this.gap(4);
  }

  private renderHorizontalRule(): void {
    this.gap(2);
    this.ensureSpace(2);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.4);
    this.pdf.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.gap(4);
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

    const fontSize = 9.5;
    const headerFontSize = 10;
    const lineHeight = this.lineHeightMm(fontSize, 1.35);
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
        this.pdf.setFillColor(236, 236, 236);
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
        this.pdf.setDrawColor(190, 190, 190);
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

    this.gap(5);
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