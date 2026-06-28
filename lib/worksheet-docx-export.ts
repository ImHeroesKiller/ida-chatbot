import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
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
  parseMarkdownBlocks,
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

type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; label: string; href: string };

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

function inlineTokensToRuns(text: string): Array<TextRun | ExternalHyperlink> {
  return parseInlineTokens(text).map((token) => {
    switch (token.kind) {
      case "bold":
        return new TextRun({ text: token.value, bold: true });
      case "italic":
        return new TextRun({ text: token.value, italics: true });
      case "code":
        return new TextRun({
          text: token.value,
          font: "Courier New",
          shading: { fill: "F3F4F6" },
        });
      case "link":
        return new ExternalHyperlink({
          children: [
            new TextRun({
              text: token.label,
              style: "Hyperlink",
              underline: {},
            }),
          ],
          link: token.href,
        });
      default:
        return new TextRun(token.value);
    }
  });
}

function headingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (Math.min(Math.max(level, 1), 6)) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    default:
      return HeadingLevel.HEADING_6;
  }
}

function buildTable(headers: string[], rows: string[][]): Table {
  const colCount = Math.max(headers.length, ...rows.map((row) => row.length));
  const normalizedHeaders = Array.from({ length: colCount }, (_, i) =>
    stripInlineMarkdown(headers[i] ?? ""),
  );
  const normalizedRows = rows.map((row) =>
    Array.from({ length: colCount }, (_, i) =>
      stripInlineMarkdown(row[i] ?? ""),
    ),
  );
  const widthPct = Math.floor(100 / Math.max(colCount, 1));

  const headerRow = new TableRow({
    children: normalizedHeaders.map(
      (cell) =>
        new TableCell({
          width: { size: widthPct, type: WidthType.PERCENTAGE },
          shading: { fill: "ECECEC" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, bold: true })],
            }),
          ],
        }),
    ),
  });

  const bodyRows = normalizedRows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              width: { size: widthPct, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun(cell)] })],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

export function buildWorksheetDocxFilename(title: string): string {
  return buildWorksheetPdfFilename(title).replace(/\.pdf$/i, ".docx");
}

export function buildWorksheetDocxDocument(
  options: WorksheetDocxExportOptions,
): Document {
  const title = stripInlineMarkdown(options.title.trim() || "Document");
  const blocks = parseMarkdownBlocks(options.content.trim());
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
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: title, bold: true })],
      }),
    );
  }

  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
        children.push(
          new Paragraph({
            heading: headingLevel(block.level),
            children: inlineTokensToRuns(block.text),
          }),
        );
        break;
      case "paragraph":
        children.push(
          new Paragraph({ children: inlineTokensToRuns(block.text) }),
        );
        break;
      case "bullet_list":
        for (const item of block.items) {
          children.push(
            new Paragraph({
              numbering: { reference: "worksheet-bullets", level: 0 },
              children: inlineTokensToRuns(item),
            }),
          );
        }
        break;
      case "ordered_list":
        for (const item of block.items) {
          children.push(
            new Paragraph({
              numbering: { reference: "worksheet-numbers", level: 0 },
              children: inlineTokensToRuns(item),
            }),
          );
        }
        break;
      case "table":
        children.push(buildTable(block.headers, block.rows));
        children.push(new Paragraph({ children: [new TextRun("")] }));
        break;
      case "code":
        for (const line of block.text.split("\n")) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || " ",
                  font: "Courier New",
                  size: 20,
                }),
              ],
              shading: { fill: "F5F5F5" },
            }),
          );
        }
        break;
      case "blockquote":
        children.push(
          new Paragraph({
            children: inlineTokensToRuns(block.lines.join(" ")),
            indent: { left: 720 },
            border: {
              left: {
                style: BorderStyle.SINGLE,
                size: 12,
                color: "CFCFCF",
                space: 12,
              },
            },
          }),
        );
        break;
      case "hr":
        children.push(
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: "CCCCCC",
                space: 1,
              },
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
            size: 24,
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