#!/usr/bin/env node

/**
 * Lightweight parser tests mirroring lib/pdf-export.ts block detection.
 */

function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function parseTableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return null;
  const normalized = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return normalized.split("|").map((cell) => stripInlineMarkdown(cell.trim()));
}

function isTableSeparator(line) {
  const cells = parseTableCells(line);
  if (!cells?.length) return false;
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdownBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const trimmed = (lines[index] ?? "").trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ kind: "heading", level: headingMatch[1].length });
      index += 1;
      continue;
    }

    const tableCells = parseTableCells(trimmed);
    if (tableCells && index + 1 < lines.length && isTableSeparator(lines[index + 1] ?? "")) {
      const rows = [];
      index += 2;
      while (index < lines.length) {
        const rowCells = parseTableCells(lines[index] ?? "");
        if (!rowCells) break;
        rows.push(rowCells);
        index += 1;
      }
      blocks.push({ kind: "table", columns: tableCells.length, rows: rows.length });
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      let count = 0;
      while (index < lines.length && /^[-*+]\s+/.test(lines[index]?.trim() ?? "")) {
        count += 1;
        index += 1;
      }
      blocks.push({ kind: "bullet_list", items: count });
      continue;
    }

    blocks.push({ kind: "paragraph" });
    index += 1;
  }

  return blocks;
}

function testMixedDocument() {
  const checks = [];
  const markdown = `# Proposal

Paragraf pembuka yang cukup panjang untuk menguji wrapping teks di PDF.

## Ringkasan
- Poin pertama
- Poin kedua

| Komponen | Qty | Harga |
| --- | ---: | ---: |
| Panel | 20 | 5.000.000 |
| Inverter | 1 | 12.000.000 |

## Penutup
Terima kasih.`;

  const blocks = parseMarkdownBlocks(markdown);
  const kinds = blocks.map((block) => block.kind);

  if (!kinds.includes("heading")) checks.push("expected heading block");
  if (!kinds.includes("table")) checks.push("expected table block");
  if (!kinds.includes("bullet_list")) checks.push("expected bullet_list block");

  const table = blocks.find((block) => block.kind === "table");
  if (!table || table.columns !== 3 || table.rows !== 2) {
    checks.push("unexpected table shape");
  }

  return { pass: checks.length === 0, checks };
}

function testFilename() {
  const checks = [];
  const title = "Proposal Proyek PLTS 2026!";
  const slug = title
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  if (!slug.includes("proposal")) checks.push("filename slug missing title");
  if (slug.includes("!")) checks.push("filename slug should strip symbols");

  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["mixed-document-blocks", testMixedDocument()],
    ["filename-slug", testFilename()],
  ];

  console.log("PDF export tests\n");
  let failed = false;

  for (const [name, result] of tests) {
    console.log(`${name}: ${result.pass ? "PASS" : "FAIL"}`);
    if (result.checks.length) console.log(`  ${result.checks.join("; ")}`);
    if (!result.pass) failed = true;
  }

  if (failed) process.exit(1);
}

main();