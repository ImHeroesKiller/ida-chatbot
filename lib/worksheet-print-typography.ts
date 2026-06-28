/**
 * Shared print typography for Worksheet Full View, print preview HTML, and
 * export pipelines.
 *
 * Keep values here aligned with:
 * - lib/pdf-export.ts (PDF rendering)
 * - lib/worksheet-docx-export.ts (DOCX rendering)
 *
 * When adjusting typography, spacing, tables, or lists, update all three
 * consumers so Full View matches exported documents.
 */

export const WORKSHEET_PRINT_PROSE_CLASS = "ida-markdown worksheet-print-prose";

export const WORKSHEET_PRINT_PAPER_CLASS = "worksheet-print-paper";

/** Page margin used in PDF export and Full View paper padding. */
export const WORKSHEET_PRINT_MARGIN_MM = 20;

export const WORKSHEET_PRINT_BODY = {
  fontSizePt: 11,
  lineHeight: 1.45,
  paragraphGapAfterMm: 3,
  color: "#181818",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

export const WORKSHEET_PRINT_HEADING_STYLES: Record<
  number,
  {
    sizePt: number;
    gapBeforeMm: number;
    gapAfterMm: number;
    lineHeight: number;
  }
> = {
  1: { sizePt: 20, gapBeforeMm: 2, gapAfterMm: 6, lineHeight: 1.3 },
  2: { sizePt: 16, gapBeforeMm: 5, gapAfterMm: 4, lineHeight: 1.35 },
  3: { sizePt: 13, gapBeforeMm: 4, gapAfterMm: 3, lineHeight: 1.4 },
  4: { sizePt: 12, gapBeforeMm: 3, gapAfterMm: 2.5, lineHeight: 1.4 },
  5: { sizePt: 11, gapBeforeMm: 2.5, gapAfterMm: 2, lineHeight: 1.45 },
  6: { sizePt: 10.5, gapBeforeMm: 2, gapAfterMm: 2, lineHeight: 1.45 },
};

export const WORKSHEET_PRINT_TABLE = {
  fontSizePt: 9.5,
  headerFontSizePt: 10,
  cellPaddingMm: 2,
  borderColor: "#bebebe",
  headerBackground: "#ececec",
  evenRowBackground: "#fafafa",
  blockGapBeforeMm: 0,
  blockGapAfterMm: 5,
  lineHeight: 1.35,
} as const;

export const WORKSHEET_PRINT_LIST = {
  fontSizePt: 11,
  bulletIndentMm: 5,
  orderedIndentMm: 8,
  itemGapAfterMm: 1,
  blockGapAfterMm: 3,
  markerColor: "#444444",
} as const;

export const WORKSHEET_PRINT_BLOCKQUOTE = {
  fontSizePt: 11,
  indentMm: 6,
  borderColor: "#b4b4b4",
  borderWidthPx: 3,
  color: "#555555",
  blockGapBeforeMm: 0,
  blockGapAfterMm: 4,
  lineHeight: 1.4,
  paddingVerticalMm: 1,
} as const;

export const WORKSHEET_PRINT_CODE = {
  inlineBackground: "#f4f4f4",
  inlineColor: "#282828",
  blockFontSizePt: 9,
  blockBackground: "#f5f5f5",
  blockBorderColor: "#dcdcdc",
  blockGapBeforeMm: 0,
  blockGapAfterMm: 3,
  blockPaddingMm: 2,
  lineHeight: 1.35,
} as const;

export const WORKSHEET_PRINT_HR = {
  gapBeforeMm: 2,
  gapAfterMm: 4,
  color: "#c8c8c8",
} as const;

function headingRules(): string {
  return Object.entries(WORKSHEET_PRINT_HEADING_STYLES)
    .map(([level, style]) => {
      const letterSpacing =
        Number(level) === 1
          ? "-0.02em"
          : Number(level) === 2
            ? "-0.01em"
            : "normal";
      return `
.worksheet-print-prose h${level} {
  font-size: ${style.sizePt}pt;
  font-weight: 700;
  line-height: ${style.lineHeight};
  color: ${WORKSHEET_PRINT_BODY.color};
  margin: ${style.gapBeforeMm}mm 0 ${style.gapAfterMm}mm;
  letter-spacing: ${letterSpacing};
}`.trim();
    })
    .join("\n\n");
}

function buildWorksheetPrintProseCss(): string {
  const body = WORKSHEET_PRINT_BODY;
  const table = WORKSHEET_PRINT_TABLE;
  const list = WORKSHEET_PRINT_LIST;
  const quote = WORKSHEET_PRINT_BLOCKQUOTE;
  const code = WORKSHEET_PRINT_CODE;
  const hr = WORKSHEET_PRINT_HR;

  return `
.worksheet-print-prose {
  font-family: ${body.fontFamily};
  font-size: ${body.fontSizePt}pt;
  line-height: ${body.lineHeight};
  color: ${body.color};
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}

.worksheet-print-prose > *:first-child {
  margin-top: 0 !important;
}

.worksheet-print-prose > *:last-child {
  margin-bottom: 0 !important;
}

.worksheet-print-prose p {
  margin: 0 0 ${body.paragraphGapAfterMm}mm;
  text-align: left;
}

.worksheet-print-prose p:last-child {
  margin-bottom: 0;
}

${headingRules()}

.worksheet-print-prose h3,
.worksheet-print-prose h4,
.worksheet-print-prose h5,
.worksheet-print-prose h6 {
  font-weight: 600;
}

.worksheet-print-prose ul,
.worksheet-print-prose ol {
  margin: 0 0 ${list.blockGapAfterMm}mm;
  padding-left: ${list.bulletIndentMm}mm;
}

.worksheet-print-prose ol {
  padding-left: ${list.orderedIndentMm}mm;
}

.worksheet-print-prose ul {
  list-style-type: disc;
}

.worksheet-print-prose ol {
  list-style-type: decimal;
}

.worksheet-print-prose li {
  margin: 0 0 ${list.itemGapAfterMm}mm;
  line-height: ${body.lineHeight};
  padding-left: 0.5mm;
}

.worksheet-print-prose li:last-child {
  margin-bottom: 0;
}

.worksheet-print-prose li > ul,
.worksheet-print-prose li > ol {
  margin-top: ${list.itemGapAfterMm}mm;
  margin-bottom: ${list.itemGapAfterMm}mm;
}

.worksheet-print-prose li::marker {
  color: ${list.markerColor};
}

.worksheet-print-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: ${table.blockGapBeforeMm}mm 0 ${table.blockGapAfterMm}mm;
  font-size: ${table.fontSizePt}pt;
  line-height: ${table.lineHeight};
}

.worksheet-print-prose th,
.worksheet-print-prose td {
  border: 1px solid ${table.borderColor};
  padding: ${table.cellPaddingMm}mm;
  text-align: left;
  vertical-align: top;
}

.worksheet-print-prose th {
  background-color: ${table.headerBackground};
  font-size: ${table.headerFontSizePt}pt;
  font-weight: 600;
  color: ${body.color};
}

.worksheet-print-prose tbody tr:nth-child(even) td {
  background-color: ${table.evenRowBackground};
}

.worksheet-print-prose blockquote {
  margin: ${quote.blockGapBeforeMm}mm 0 ${quote.blockGapAfterMm}mm;
  padding: ${quote.paddingVerticalMm}mm 0 ${quote.paddingVerticalMm}mm ${quote.indentMm}mm;
  border-left: ${quote.borderWidthPx}px solid ${quote.borderColor};
  color: ${quote.color};
  font-size: ${quote.fontSizePt}pt;
  font-style: italic;
  line-height: ${quote.lineHeight};
}

.worksheet-print-prose blockquote p {
  margin-bottom: ${body.paragraphGapAfterMm}mm;
}

.worksheet-print-prose blockquote p:last-child {
  margin-bottom: 0;
}

.worksheet-print-prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92em;
  background: ${code.inlineBackground};
  padding: 0.15em 0.35em;
  border-radius: 3px;
  color: ${code.inlineColor};
}

.worksheet-print-prose pre {
  margin: ${code.blockGapBeforeMm}mm 0 ${code.blockGapAfterMm}mm;
  padding: ${code.blockPaddingMm}mm;
  background: ${code.blockBackground};
  border: 1px solid ${code.blockBorderColor};
  border-radius: 4px;
  overflow-x: auto;
  font-size: ${code.blockFontSizePt}pt;
  line-height: ${code.lineHeight};
}

.worksheet-print-prose pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
  color: ${code.inlineColor};
}

.worksheet-print-prose a {
  color: #1d4ed8;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.worksheet-print-prose strong {
  font-weight: 600;
}

.worksheet-print-prose em {
  font-style: italic;
}

.worksheet-print-prose hr {
  border: none;
  border-top: 1px solid ${hr.color};
  margin: ${hr.gapBeforeMm}mm 0 ${hr.gapAfterMm}mm;
}

.worksheet-print-prose:empty::before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
}

.worksheet-print-paper {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08);
}
`.trim();
}

/** CSS injected into Full View, print preview, and read-only print prose. */
export const WORKSHEET_PRINT_PROSE_CSS = buildWorksheetPrintProseCss();

/** PDF renderer heading lookup — mirrors HEADING_STYLES in pdf-export.ts. */
export function worksheetPrintHeadingForPdf(level: number): {
  size: number;
  gapBefore: number;
  gapAfter: number;
  lineHeight: number;
} {
  const style =
    WORKSHEET_PRINT_HEADING_STYLES[Math.min(level, 6)] ??
    WORKSHEET_PRINT_HEADING_STYLES[3]!;
  return {
    size: style.sizePt,
    gapBefore: style.gapBeforeMm,
    gapAfter: style.gapAfterMm,
    lineHeight: style.lineHeight,
  };
}