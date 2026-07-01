#!/usr/bin/env node

/**
 * Validates shared worksheet print typography tokens and writes a visual
 * comparison fixture for Full View vs PDF export review.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

function loadTypographyPayload() {
  const snippet =
    'import { WORKSHEET_PRINT_BODY, WORKSHEET_PRINT_HEADING_STYLES, WORKSHEET_PRINT_MARGIN_MM, WORKSHEET_PRINT_PROSE_CSS, WORKSHEET_PRINT_TABLE } from "./lib/worksheet-print-typography.ts"; ' +
    "console.log(JSON.stringify({ css: WORKSHEET_PRINT_PROSE_CSS, marginMm: WORKSHEET_PRINT_MARGIN_MM, bodyPt: WORKSHEET_PRINT_BODY.fontSizePt, paragraphGapMm: WORKSHEET_PRINT_BODY.paragraphGapAfterMm, h1SizePt: WORKSHEET_PRINT_HEADING_STYLES[1].sizePt, tableBorder: WORKSHEET_PRINT_TABLE.borderColor }));";
  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

function runTokenChecks(payload) {
  const checks = [];

  checks.push(["body font 11pt", payload.bodyPt === 11]);
  checks.push(["H1 20pt", payload.h1SizePt === 20]);
  checks.push(["table border #bebebe", payload.tableBorder === "#bebebe"]);
  checks.push(["page margin 20mm", payload.marginMm === 20]);
  checks.push(["paragraph gap 3mm", payload.paragraphGapMm === 3]);
  checks.push(["prose CSS generated", payload.css.length > 1000]);

  const failed = checks.filter(([, ok]) => !ok);
  assert(failed.length === 0, `Token checks failed: ${failed.map(([name]) => name).join(", ")}`);

  return checks.length;
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let listDepth = 0;
  let listType = "ul";
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  const closeListsToDepth = (targetDepth) => {
    while (listDepth > targetDepth) {
      parts.push(listType === "ol" ? "</ol>" : "</ul>");
      listDepth -= 1;
    }
  };

  const closeAllLists = () => closeListsToDepth(0);

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

    if (inCodeBlock) {
      if (trimmed.startsWith("```")) {
        parts.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
        inCodeBlock = false;
        codeLines = [];
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    if (!trimmed) {
      closeAllLists();
      flushTable();
      continue;
    }

    if (trimmed.startsWith("|")) {
      closeAllLists();
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
      closeAllLists();
      const level = headingMatch[1].length;
      parts.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const bulletMatch = rawLine.match(/^(\s*)[-*+]\s+(.+)$/);
    if (bulletMatch) {
      const depth = Math.floor(bulletMatch[1].length / 2) + 1;
      if (listType !== "ul" || depth !== listDepth) {
        closeListsToDepth(0);
        listType = "ul";
        for (let level = 0; level < depth; level += 1) {
          parts.push("<ul>");
        }
        listDepth = depth;
      } else if (depth < listDepth) {
        closeListsToDepth(depth);
      } else if (depth > listDepth) {
        parts.push("<ul>");
        listDepth = depth;
      }
      parts.push(`<li>${inlineMarkdown(bulletMatch[2])}</li>`);
      continue;
    }

    const orderedMatch = rawLine.match(/^(\s*)\d+\.\s+(.+)$/);
    if (orderedMatch) {
      const depth = Math.floor(orderedMatch[1].length / 2) + 1;
      if (listType !== "ol" || depth !== listDepth) {
        closeListsToDepth(0);
        listType = "ol";
        for (let level = 0; level < depth; level += 1) {
          parts.push("<ol>");
        }
        listDepth = depth;
      } else if (depth < listDepth) {
        closeListsToDepth(depth);
      } else if (depth > listDepth) {
        parts.push("<ol>");
        listDepth = depth;
      }
      parts.push(`<li>${inlineMarkdown(orderedMatch[2])}</li>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      closeAllLists();
      parts.push(`<blockquote><p>${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</p></blockquote>`);
      continue;
    }

    if (trimmed === "---") {
      closeAllLists();
      parts.push("<hr />");
      continue;
    }

    if (trimmed.startsWith("```")) {
      closeAllLists();
      inCodeBlock = true;
      codeLines = [];
      continue;
    }

    closeAllLists();
    parts.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeAllLists();
  flushTable();
  return parts.join("\n");
}

async function writeVisualFixture(payload) {
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
  const payload = loadTypographyPayload();
  const tokenCount = runTokenChecks(payload);
  const fixturePath = await writeVisualFixture(payload);

  console.log(`OK: ${tokenCount} typography token checks passed`);
  console.log(`Visual fixture: ${fixturePath}`);
  console.log("Compare this HTML side-by-side with Export PDF for heading, list, table, and blockquote parity.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});