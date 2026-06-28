#!/usr/bin/env node

const WORKSHEET_START_MARKER = "<<<IDA_WORKSHEET>>>";
const WORKSHEET_END_MARKER = "<<<END_IDA_WORKSHEET>>>";

function parseWorksheetFromResponse(fullText, locale) {
  const pattern = new RegExp(
    `${WORKSHEET_START_MARKER}\\s*([\\s\\S]*?)\\s*${WORKSHEET_END_MARKER}`,
  );
  const match = fullText.match(pattern);
  if (!match?.[1]) {
    return { chatMessage: fullText.trim(), worksheet: null };
  }

  const worksheetContent = match[1].trim();
  const chatMessage = fullText.replace(match[0], "").trim() || "fallback";
  const heading = worksheetContent.match(/^#\s+(.+)$/m);
  const title = heading?.[1]?.trim() ?? "Dokumen Baru";

  return {
    chatMessage,
    worksheet: { title, content: worksheetContent },
  };
}

function testParseWorksheet() {
  const checks = [];
  const full = `Dokumen sudah siap di Worksheet.

${WORKSHEET_START_MARKER}
# Proposal Proyek PLTS
## Ringkasan
Konten proposal...
${WORKSHEET_END_MARKER}`;

  const parsed = parseWorksheetFromResponse(full, "id");

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

async function main() {
  const result = testParseWorksheet();
  console.log("Worksheet tests\n");
  console.log(`parse-worksheet: ${result.pass ? "PASS" : "FAIL"}`);
  if (result.checks.length) {
    console.log(`  ${result.checks.join("; ")}`);
  }

  if (!result.pass) process.exit(1);
}

main();