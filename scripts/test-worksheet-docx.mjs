#!/usr/bin/env node

function buildWorksheetDocxFilename(title) {
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
  return `${slug}-${date}.docx`;
}

function testDocxFilename() {
  const checks = [];
  const filename = buildWorksheetDocxFilename("Proposal Proyek PLTS");
  if (!filename.endsWith(".docx")) checks.push("expected .docx extension");
  if (!filename.includes("proposal")) checks.push("expected slug in filename");
  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [["docx-filename", testDocxFilename()]];

  console.log("Worksheet DOCX tests\n");

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