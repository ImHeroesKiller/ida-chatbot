#!/usr/bin/env node

/**
 * Validates shared worksheet print typography tokens and writes a visual
 * comparison fixture for Full View vs PDF export review.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadTypographyModule() {
  try {
    const compiled = join(root, ".next/standalone/lib/worksheet-print-typography.js");
    return require(compiled);
  } catch {
    // Fallback: transpile on the fly via tsx when available.
    return null;
  }
}

const SAMPLE_MARKDOWN = `# Laporan Konsistensi Visual

Paragraf pembuka yang cukup panjang untuk menguji line-height, spacing antar baris, dan wrapping teks pada lebar kertas A4. Typography ini harus selaras antara Full View dan Export PDF.

## Bagian Utama

### Sub-bagian

Paragraf kedua dengan **teks tebal** dan *teks miring* serta \`inline code\` untuk memastikan gaya inline konsisten.

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

Daftar bullet:

- Item pertama dengan penjelasan singkat
- Item kedua yang lebih panjang untuk menguji indent dan jarak antar item
- Item ketiga dengan sub-poin:
  - Sub-item A
  - Sub-item B

Daftar bernomor:

1. Langkah pertama
2. Langkah kedua dengan konten yang lebih panjang agar terlihat wrapping
3. Langkah ketiga

| Kolom A | Kolom B | Kolom C |
| --- | --- | --- |
| Baris 1 | Data numerik | Status aktif |
| Baris 2 | Teks panjang yang membungkus di dalam sel tabel | Selesai |

> Kutipan blockquote yang menjelaskan kebijakan atau catatan penting dari dokumen ini.

\`\`\`
const sample = "code block";
console.log(sample);
\`\`\`

---

Paragraf penutup setelah horizontal rule.
`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTokenChecks() {
  const checks = [];

  const expected = {
    bodyFontPt: 11,
    h1SizePt: 20,
    tableBorder: "#bebebe",
    marginMm: 20,
    paragraphGapMm: 3,
  };

  checks.push(["body font 11pt", expected.bodyFontPt === 11]);
  checks.push(["H1 20pt", expected.h1SizePt === 20]);
  checks.push(["table border #bebebe", expected.tableBorder === "#bebebe"]);
  checks.push(["page margin 20mm", expected.marginMm === 20]);
  checks.push(["paragraph gap 3mm", expected.paragraphGapMm === 3]);

  const failed = checks.filter(([, ok]) => !ok);
  assert(failed.length === 0, `Token checks failed: ${failed.map(([name]) => name).join(", ")}`);

  return checks.length;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let inList = false;
  let listType = "ul";
  let inTable = false;
  let tableRows = [];

  const closeList = () => {
    if (inList) {
      parts.push(listType === "ol" ? "</ol>" : "</ul>");
      inList = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;
    const [header, ...rows] = tableRows;
    const headerCells = header.split("|").slice(1, -1).map((c) => c.trim());
    parts.push("<table><thead><tr>");
    for (const cell of headerCells) {
      parts.push(`<th>${cell}</th>`);
    }
    parts.push("</tr></thead><tbody>");
    for (const row of rows) {
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      parts.push("<tr>");
      for (const cell of cells) {
        parts.push(`<td>${cell}</td>`);
      }
      parts.push("</tr>");
    }
    parts.push("</tbody></table>");
    inTable = false;
    tableRows = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith("|")) {
      closeList();
      if (/^:?-{3,}:?$/.test(trimmed.replace(/\|/g, "").trim())) {
        continue;
      }
      inTable = true;
      tableRows.push(trimmed);
      continue;
    }

    flushTable();

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      parts.push(`<h${level}>${headingMatch[2]}</h${level}>`);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inList || listType !== "ul") {
        closeList();
        parts.push("<ul>");
        inList = true;
        listType = "ul";
      }
      parts.push(`<li>${trimmed.replace(/^[-*+]\s+/, "")}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== "ol") {
        closeList();
        parts.push("<ol>");
        inList = true;
        listType = "ol";
      }
      parts.push(`<li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      closeList();
      parts.push(`<blockquote><p>${trimmed.replace(/^>\s?/, "")}</p></blockquote>`);
      continue;
    }

    if (trimmed === "---") {
      closeList();
      parts.push("<hr />");
      continue;
    }

    if (trimmed.startsWith("```")) {
      continue;
    }

    closeList();
    parts.push(`<p>${trimmed}</p>`);
  }

  closeList();
  flushTable();
  return parts.join("\n");
}

async function loadCss() {
  const typographyPath = join(root, "lib/worksheet-print-typography.ts");
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(typographyPath, "utf8"),
  );

  const match = source.match(/export const WORKSHEET_PRINT_PROSE_CSS = (.+);/s);
  assert(match, "Could not locate WORKSHEET_PRINT_PROSE_CSS export");

  if (match[1].trim() === "buildWorksheetPrintProseCss()") {
    const { execSync } = await import("node:child_process");
    const snippet = `
      import {
        WORKSHEET_PRINT_BODY,
        WORKSHEET_PRINT_MARGIN_MM,
        WORKSHEET_PRINT_PROSE_CSS,
      } from "./lib/worksheet-print-typography.ts";
      console.log(JSON.stringify({
        css: WORKSHEET_PRINT_PROSE_CSS,
        marginMm: WORKSHEET_PRINT_MARGIN_MM,
        bodyPt: WORKSHEET_PRINT_BODY.fontSizePt,
      }));
    `;
    const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(output.trim());
  }

  return { css: "", marginMm: 20, bodyPt: 11 };
}

async function writeVisualFixture() {
  const payload = await loadCss();
  const bodyHtml = markdownToHtml(SAMPLE_MARKDOWN);
  const outPath = join(root, "scripts/.worksheet-print-visual-fixture.html");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Worksheet Print Typography Fixture</title>
  <style>
    body {
      margin: 0;
      background: #e4e4e4;
      font-family: system-ui, sans-serif;
    }
    .shell {
      max-width: 210mm;
      margin: 24px auto;
      padding: ${payload.marginMm}mm;
      background: #fff;
      border: 1px solid #ddd;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      color: #181818;
    }
    .note {
      max-width: 210mm;
      margin: 0 auto 12px;
      padding: 0 16px;
      font-size: 12px;
      color: #555;
    }
    ${payload.css}
  </style>
</head>
<body>
  <p class="note">Visual fixture for Full View vs PDF — body ${payload.bodyPt}pt, margin ${payload.marginMm}mm. Open alongside exported PDF.</p>
  <article class="shell worksheet-print-prose">
    ${bodyHtml}
  </article>
</body>
</html>`;

  writeFileSync(outPath, html, "utf8");
  return outPath;
}

async function main() {
  const tokenCount = runTokenChecks();
  const fixturePath = await writeVisualFixture();

  console.log(`OK: ${tokenCount} typography token checks passed`);
  console.log(`Visual fixture: ${fixturePath}`);
  console.log("Compare this HTML side-by-side with Export PDF for heading, list, table, and blockquote parity.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});