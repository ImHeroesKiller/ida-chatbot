#!/usr/bin/env node

const WORKSHEET_START_MARKER = "<<<IDA_WORKSHEET>>>";
const WORKSHEET_END_MARKER = "<<<END_IDA_WORKSHEET>>>";

function extractWorksheetTitle(markdown) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading?.[1]?.trim()) return heading[1].trim().slice(0, 120);
  return "Dokumen Baru";
}

function parseWithMarkers(fullText) {
  const pattern = new RegExp(
    `${WORKSHEET_START_MARKER}\\s*([\\s\\S]*?)\\s*${WORKSHEET_END_MARKER}`,
  );
  const match = fullText.match(pattern);
  if (!match?.[1]?.trim()) return null;
  const content = match[1].trim();
  return {
    chatMessage: fullText.replace(match[0], "").trim() || "fallback",
    worksheet: { title: extractWorksheetTitle(content), content },
    parseSource: "markers",
  };
}

function parseWithPartialMarker(fullText) {
  const startIdx = fullText.indexOf(WORKSHEET_START_MARKER);
  if (startIdx < 0) return null;
  let remainder = fullText.slice(startIdx + WORKSHEET_START_MARKER.length);
  const endIdx = remainder.indexOf(WORKSHEET_END_MARKER);
  if (endIdx >= 0) remainder = remainder.slice(0, endIdx);
  const content = remainder.trim();
  if (!content) return null;
  return {
    chatMessage: fullText.slice(0, startIdx).trim() || "fallback",
    worksheet: { title: extractWorksheetTitle(content), content },
    parseSource: "partial_marker",
  };
}

function parseWithJsonBlock(fullText) {
  const match = fullText.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1]);
    const content = parsed.content ?? parsed.markdown ?? parsed.body;
    if (!content?.trim()) return null;
    return {
      chatMessage: fullText.replace(match[0], "").trim() || "fallback",
      worksheet: {
        title: parsed.title?.trim() || extractWorksheetTitle(content),
        content: content.trim(),
      },
      parseSource: "json_block",
    };
  } catch {
    return null;
  }
}

function parseWorksheetFromResponse(fullText) {
  return (
    parseWithMarkers(fullText) ??
    parseWithPartialMarker(fullText) ??
    parseWithJsonBlock(fullText) ?? {
      chatMessage: fullText.trim(),
      worksheet: null,
      error: "parse_failed",
    }
  );
}

function testParseWorksheet() {
  const checks = [];
  const full = `Dokumen sudah siap di Worksheet.

${WORKSHEET_START_MARKER}
# Proposal Proyek PLTS
## Ringkasan
Konten proposal...
${WORKSHEET_END_MARKER}`;

  const parsed = parseWorksheetFromResponse(full);

  if (!parsed.worksheet) {
    checks.push("expected worksheet payload");
  } else {
    if (parsed.worksheet.title !== "Proposal Proyek PLTS") {
      checks.push(`unexpected title: ${parsed.worksheet.title}`);
    }
    if (!parsed.worksheet.content.includes("## Ringkasan")) {
      checks.push("expected markdown body in worksheet content");
    }
  }

  if (parsed.chatMessage.includes(WORKSHEET_START_MARKER)) {
    checks.push("chat message should not include worksheet markers");
  }

  return { pass: checks.length === 0, checks };
}

function testPartialMarkerFallback() {
  const checks = [];
  const full = `Siap!

${WORKSHEET_START_MARKER}
# Laporan Bulanan
## Pendahuluan
Isi laporan yang cukup panjang untuk lolos validasi struktur dokumen.`;

  const parsed = parseWorksheetFromResponse(full);

  if (!parsed.worksheet) {
    checks.push("expected partial marker fallback");
  } else if (parsed.parseSource !== "partial_marker") {
    checks.push(`expected partial_marker source, got ${parsed.parseSource}`);
  }

  return { pass: checks.length === 0, checks };
}

function testJsonBlockFallback() {
  const checks = [];
  const full = `Dokumen dari JSON:

\`\`\`json
{
  "title": "Surat Penawaran",
  "content": "# Surat Penawaran\\n\\n## Detail\\nKonten surat."
}
\`\`\``;

  const parsed = parseWorksheetFromResponse(full);

  if (!parsed.worksheet) {
    checks.push("expected json block fallback");
  } else {
    if (parsed.worksheet.title !== "Surat Penawaran") {
      checks.push(`unexpected title: ${parsed.worksheet.title}`);
    }
    if (parsed.parseSource !== "json_block") {
      checks.push(`expected json_block source, got ${parsed.parseSource}`);
    }
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["parse-worksheet", testParseWorksheet()],
    ["partial-marker-fallback", testPartialMarkerFallback()],
    ["json-block-fallback", testJsonBlockFallback()],
  ];

  console.log("Worksheet tests\n");

  let failed = false;
  for (const [name, result] of tests) {
    console.log(`${name}: ${result.pass ? "PASS" : "FAIL"}`);
    if (result.checks.length) {
      console.log(`  ${result.checks.join("; ")}`);
    }
    if (!result.pass) failed = true;
  }

  if (failed) process.exit(1);
}

main();