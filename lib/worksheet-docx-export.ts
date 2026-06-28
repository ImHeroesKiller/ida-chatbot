import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { Locale } from "@/lib/config";
import {
  buildWorksheetPdfFilename,
  formatPdfExportDate,
  formatPdfPageLabel,
  stripInlineMarkdown,
} from "@/lib/pdf-export";
import {
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
} from "@/lib/worksheet-branding-config";
import {
  brandingAddressLines,
  brandingContactLines,
  buildFooterSummary,
} from "@/lib/worksheet-letterhead";

export interface WorksheetDocxExportOptions {
  title: string;
  content: string;
  filename?: string;
  branding?: Partial<WorksheetBrandingConfig>;
  locale?: Locale;
  includeBranding?: boolean;
  showPageNumbers?: boolean;
  showExportDate?: boolean;
}

const MM_TO_TWIPS = 56.6929133858;

function mmToTwips(mm: number): number {
  return Math.round(mm * MM_TO_TWIPS);
}

const BODY_FONT_SIZE = 22;
const PARAGRAPH_SPACING_AFTER = Math.round(MM_TO_TWIPS * 3);
const LIST_ITEM_SPACING_AFTER = Math.round(MM_TO_TWIPS * 1);
const LIST_BLOCK_SPACING_AFTER = Math.round(MM_TO_TWIPS * 3);
const TABLE_BLOCK_SPACING_AFTER = Math.round(MM_TO_TWIPS * 5);
const CODE_BLOCK_SPACING_AFTER = Math.round(MM_TO_TWIPS * 3);

const DOCX_HEADING_STYLES: Record<
  number,
  { size: number; spacingBefore: number; spacingAfter: number }
> = {
  1: { size: 40, spacingBefore: mmToTwips(2), spacingAfter: mmToTwips(6) },
  2: { size: 32, spacingBefore: mmToTwips(5), spacingAfter: mmToTwips(4) },
  3: { size: 26, spacingBefore: mmToTwips(4), spacingAfter: mmToTwips(3) },
  4: { size: 24, spacingBefore: mmToTwips(3), spacingAfter: mmToTwips(2.5) },
  5: { size: 22, spacingBefore: mmToTwips(2.5), spacingAfter: mmToTwips(2) },
  6: { size: 21, spacingBefore: mmToTwips(2), spacingAfter: mmToTwips(2) },
};

const TABLE_CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "BEBEBE" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "BEBEBE" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "BEBEBE" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "BEBEBE" },
};

const TABLE_CELL_MARGINS = {
  top: 80,
  bottom: 80,
  left: 120,
  right: 120,
};

type DocxMarkdownBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullet_list"; items: Array<{ level: number; text: string }> }
  | { kind: "ordered_list"; items: Array<{ level: number; text: string }> }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "code"; text: string }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "hr" };

type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; label: string; href: string };

type InlineRunOptions = {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
};

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function docxColor(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function parseDocxTableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return null;

  const normalized = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = parseDocxTableCells(line);
  if (!cells?.length) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function listIndentLevel(rawLine: string, kind: "bullet" | "ordered"): number {
  const match =
    kind === "bullet"
      ? rawLine.match(/^(\s*)[-*+]\s+/)
      : rawLine.match(/^(\s*)\d+\.\s+/);
  if (!match) return 0;
  return Math.min(Math.floor(match[1].length / 2), 1);
}

function extractListItemText(rawLine: string, kind: "bullet" | "ordered"): string {
  const match =
    kind === "bullet"
      ? rawLine.match(/^\s*[-*+]\s+(.*)$/)
      : rawLine.match(/^\s*\d+\.\s+(.*)$/);
  return match?.[1]?.trim() ?? "";
}

function parseDocxMarkdownBlocks(markdown: string): DocxMarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: DocxMarkdownBlock[] = [];

  let index = 0;
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushParagraph = (buffer: string[]) => {
    const text = buffer.join(" ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
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
        text: headingMatch[2].trim(),
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
          lines[index]!.trim().replace(/^>\s?/, ""),
        );
        index += 1;
      }
      blocks.push({ kind: "blockquote", lines: quoteLines });
      continue;
    }

    const tableCells = parseDocxTableCells(trimmed);
    if (
      tableCells &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1] ?? "")
    ) {
      flushParagraph(paragraphBuffer);
      const headers = tableCells;
      index += 2;
      const rows: string[][] = [];

      while (index < lines.length) {
        const rowCells = parseDocxTableCells(lines[index] ?? "");
        if (!rowCells) break;
        rows.push(rowCells);
        index += 1;
      }

      blocks.push({ kind: "table", headers, rows });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(rawLine)) {
      flushParagraph(paragraphBuffer);
      const items: Array<{ level: number; text: string }> = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index] ?? "")) {
        const line = lines[index] ?? "";
        items.push({
          level: listIndentLevel(line, "bullet"),
          text: extractListItemText(line, "bullet"),
        });
        index += 1;
      }
      blocks.push({ kind: "bullet_list", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(rawLine)) {
      flushParagraph(paragraphBuffer);
      const items: Array<{ level: number; text: string }> = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? "")) {
        const line = lines[index] ?? "";
        items.push({
          level: listIndentLevel(line, "ordered"),
          text: extractListItemText(line, "ordered"),
        });
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

function buildLetterheadParagraphs(
  branding: WorksheetBrandingConfig,
  documentTitle: string,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const primaryColor = docxColor(branding.primaryColor);
  const addressLines = brandingAddressLines(branding.address);
  const contactLines = brandingContactLines(branding);

  if (branding.logoDataUrl) {
    try {
      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: dataUrlToUint8Array(branding.logoDataUrl),
              transformation: { width: 96, height: 36 },
              type: branding.logoDataUrl.includes("image/png")
                ? "png"
                : branding.logoDataUrl.includes("image/jpeg") ||
                    branding.logoDataUrl.includes("image/jpg")
                  ? "jpg"
                  : "png",
            }),
          ],
        }),
      );
    } catch {
      // Skip invalid logo data.
    }
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: branding.brandName,
          bold: true,
          size: 28,
          color: primaryColor,
        }),
        new TextRun({
          text: `\t${documentTitle}`,
          size: 20,
          color: "666666",
        }),
      ],
      tabStops: [{ type: "right", position: 9000 }],
    }),
  );

  if (branding.tagline.trim()) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: branding.tagline.trim(),
            italics: true,
            size: 20,
            color: "555555",
          }),
        ],
      }),
    );
  }

  for (const line of addressLines) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 18, color: "666666" })],
      }),
    );
  }

  if (contactLines.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactLines.join(" · "),
            size: 18,
            color: "666666",
          }),
        ],
      }),
    );
  }

  if (branding.showHeaderDivider) {
    paragraphs.push(
      new Paragraph({
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: primaryColor,
            space: 4,
          },
        },
        spacing: { after: 240 },
      }),
    );
  } else {
    paragraphs.push(new Paragraph({ spacing: { after: 240 } }));
  }

  return paragraphs;
}

function buildFooterParagraphs(
  branding: WorksheetBrandingConfig,
  locale: Locale,
  showExportDate: boolean,
  showPageNumbers: boolean,
): Paragraph[] {
  const exportDate = formatPdfExportDate(locale);
  const footerSummary = buildFooterSummary(branding);
  const rightParts = [footerSummary];
  if (showPageNumbers) {
    rightParts.push(formatPdfPageLabel(1, 1, locale));
  }
  const rightLabel = rightParts.filter(Boolean).join(" · ");

  return [
    new Paragraph({
      border: {
        top: {
          style: BorderStyle.SINGLE,
          size: 4,
          color: "DDDDDD",
          space: 6,
        },
      },
      spacing: { before: 360 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: showExportDate ? exportDate : "",
          size: 18,
          color: "666666",
        }),
        new TextRun({
          text: `\t${rightLabel}`,
          size: 18,
          color: "666666",
        }),
      ],
      tabStops: [{ type: "right", position: 9000 }],
    }),
  ];
}

function parseInlineTokens(text: string): InlineToken[] {
  const pattern =
    /(\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        kind: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    if (match[2] && match[3]) {
      tokens.push({ kind: "link", label: match[2], href: match[3] });
    } else if (match[4]) {
      tokens.push({ kind: "bold", value: match[4] });
    } else if (match[5]) {
      tokens.push({ kind: "italic", value: match[5] });
    } else if (match[6]) {
      tokens.push({ kind: "code", value: match[6] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: "text", value: text.slice(lastIndex) });
  }

  if (!tokens.length) {
    tokens.push({ kind: "text", value: text });
  }

  return tokens;
}

function inlineTokensToRuns(
  text: string,
  options: InlineRunOptions = {},
): Array<TextRun | ExternalHyperlink> {
  return parseInlineTokens(text).map((token) => {
    switch (token.kind) {
      case "bold":
        return new TextRun({
          text: token.value,
          bold: true,
          italics: options.italic,
          size: options.size,
          color: options.color,
        });
      case "italic":
        return new TextRun({
          text: token.value,
          italics: true,
          bold: options.bold,
          size: options.size,
          color: options.color,
        });
      case "code":
        return new TextRun({
          text: token.value,
          font: "Courier New",
          size: options.size ?? 20,
          shading: { fill: "F3F4F6" },
          color: options.color,
        });
      case "link":
        return new ExternalHyperlink({
          children: [
            new TextRun({
              text: token.label,
              style: "Hyperlink",
              underline: {},
              bold: options.bold,
              italics: options.italic,
              size: options.size,
            }),
          ],
          link: token.href,
        });
      default:
        return new TextRun({
          text: token.value,
          bold: options.bold,
          italics: options.italic,
          size: options.size,
          color: options.color,
        });
    }
  });
}

function buildHeadingParagraph(level: number, text: string): Paragraph {
  const style = DOCX_HEADING_STYLES[Math.min(level, 6)] ?? DOCX_HEADING_STYLES[3];
  return new Paragraph({
    children: inlineTokensToRuns(text, { bold: true, size: style.size }),
    spacing: {
      before: style.spacingBefore,
      after: style.spacingAfter,
    },
  });
}

function buildTableCell(
  text: string,
  options: { header?: boolean; widthPct: number },
): TableCell {
  const runs = inlineTokensToRuns(text, options.header ? { bold: true } : {});
  return new TableCell({
    width: { size: options.widthPct, type: WidthType.PERCENTAGE },
    borders: TABLE_CELL_BORDER,
    margins: TABLE_CELL_MARGINS,
    shading: options.header ? { fill: "ECECEC" } : undefined,
    children: [
      new Paragraph({
        children: runs.length ? runs : [new TextRun({ text: " " })],
        spacing: { before: 0, after: 0 },
      }),
    ],
  });
}

function buildTable(headers: string[], rows: string[][]): Table {
  const colCount = Math.max(headers.length, ...rows.map((row) => row.length), 1);
  const normalizedHeaders = Array.from(
    { length: colCount },
    (_, i) => headers[i] ?? "",
  );
  const normalizedRows = rows.map((row) =>
    Array.from({ length: colCount }, (_, i) => row[i] ?? ""),
  );
  const widthPct = Math.floor(100 / colCount);

  const headerRow = new TableRow({
    children: normalizedHeaders.map((cell) =>
      buildTableCell(cell, { header: true, widthPct }),
    ),
  });

  const bodyRows = normalizedRows.map(
    (row) =>
      new TableRow({
        children: row.map((cell) =>
          buildTableCell(cell, { header: false, widthPct }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_CELL_BORDER,
    rows: [headerRow, ...bodyRows],
  });
}

function buildListParagraphs(
  items: Array<{ level: number; text: string }>,
  reference: "worksheet-bullets" | "worksheet-numbers",
): Paragraph[] {
  return items.map((item, index) =>
    new Paragraph({
      numbering: { reference, level: item.level },
      children: inlineTokensToRuns(item.text),
      spacing: {
        after:
          index === items.length - 1
            ? LIST_BLOCK_SPACING_AFTER
            : LIST_ITEM_SPACING_AFTER,
      },
    }),
  );
}

function buildCodeBlockParagraphs(code: string): Paragraph[] {
  const lines = code.split("\n");
  const codeIndent = 120;
  const codeColor = "282828";

  return lines.map((line, index) => {
    const isFirst = index === 0;
    const isLast = index === lines.length - 1;

    return new Paragraph({
      children: [
        new TextRun({
          text: line || " ",
          font: "Courier New",
          size: 18,
          color: codeColor,
        }),
      ],
      shading: { fill: "F5F5F5" },
      indent: { left: codeIndent, right: codeIndent },
      spacing: {
        before: isFirst ? 80 : 0,
        after: isLast ? CODE_BLOCK_SPACING_AFTER : 0,
        line: 276,
      },
      border: {
        top: isFirst
          ? {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "DCDCDC",
              space: 4,
            }
          : undefined,
        bottom: isLast
          ? {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "DCDCDC",
              space: 4,
            }
          : undefined,
        left: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "DCDCDC",
          space: 4,
        },
        right: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: "DCDCDC",
          space: 4,
        },
      },
    });
  });
}

function buildBlockquoteParagraph(lines: string[]): Paragraph {
  return new Paragraph({
    children: inlineTokensToRuns(lines.join(" "), { italic: true }),
    indent: { left: 720 },
    spacing: {
      before: mmToTwips(2),
      after: mmToTwips(4),
    },
    border: {
      left: {
        style: BorderStyle.SINGLE,
        size: 18,
        color: "B4B4B4",
        space: 10,
      },
    },
  });
}

export function buildWorksheetDocxFilename(title: string): string {
  return buildWorksheetPdfFilename(title).replace(/\.pdf$/i, ".docx");
}

export function buildWorksheetDocxDocument(
  options: WorksheetDocxExportOptions,
): Document {
  const title = stripInlineMarkdown(options.title.trim() || "Document");
  const blocks = parseDocxMarkdownBlocks(options.content.trim());
  const children: Array<Paragraph | Table> = [];
  const includeBranding = options.includeBranding !== false;
  const branding = parseWorksheetBrandingConfig(options.branding ?? {});
  const locale = options.locale ?? "en";
  const showExportDate = options.showExportDate !== false;
  const showPageNumbers = options.showPageNumbers !== false;

  if (includeBranding) {
    children.push(...buildLetterheadParagraphs(branding, title));
  }

  if (title && !includeBranding) {
    children.push(buildHeadingParagraph(1, title));
  }

  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
        children.push(buildHeadingParagraph(block.level, block.text));
        break;
      case "paragraph":
        children.push(
          new Paragraph({
            children: inlineTokensToRuns(block.text),
            spacing: { after: PARAGRAPH_SPACING_AFTER },
          }),
        );
        break;
      case "bullet_list":
        children.push(...buildListParagraphs(block.items, "worksheet-bullets"));
        break;
      case "ordered_list":
        children.push(...buildListParagraphs(block.items, "worksheet-numbers"));
        break;
      case "table":
        children.push(buildTable(block.headers, block.rows));
        children.push(
          new Paragraph({
            children: [new TextRun("")],
            spacing: { after: TABLE_BLOCK_SPACING_AFTER },
          }),
        );
        break;
      case "code":
        children.push(...buildCodeBlockParagraphs(block.text));
        break;
      case "blockquote":
        children.push(buildBlockquoteParagraph(block.lines));
        break;
      case "hr":
        children.push(
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: "C8C8C8",
                space: 1,
              },
            },
            spacing: {
              before: mmToTwips(2),
              after: mmToTwips(4),
            },
          }),
        );
        break;
      default:
        break;
    }
  }

  if (includeBranding) {
    children.push(
      ...buildFooterParagraphs(
        branding,
        locale,
        showExportDate,
        showPageNumbers,
      ),
    );
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: BODY_FONT_SIZE,
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "worksheet-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: "◦",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 1440, hanging: 360 },
                },
              },
            },
          ],
        },
        {
          reference: "worksheet-numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: "%2.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 1440, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  });
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportWorksheetToDocx(
  options: WorksheetDocxExportOptions,
): Promise<void> {
  const trimmedContent = options.content.trim();
  if (!trimmedContent) {
    throw new Error("Worksheet content is empty.");
  }

  const doc = buildWorksheetDocxDocument(options);
  const blob = await Packer.toBlob(doc);
  const filename =
    options.filename ??
    buildWorksheetDocxFilename(options.title.trim() || "Document");

  triggerBrowserDownload(blob, filename);
}