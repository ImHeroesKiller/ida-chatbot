#!/usr/bin/env node

function clampSelection(value, start, end) {
  const length = value.length;
  return {
    start: Math.max(0, Math.min(start, length)),
    end: Math.max(0, Math.min(end, length)),
  };
}

function wrapMarkdownSelection(value, selection, before, after, placeholder = "text") {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const selected = value.slice(start, end) || placeholder;
  const nextValue =
    value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return {
    value: nextValue,
    selection: { start: cursorStart, end: cursorEnd },
  };
}

function insertMarkdownPrefix(value, selection, prefix) {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, blockEnd);

  const lines = block.split("\n").map((line) => {
    const trimmed = line.trimStart();
    if (!trimmed) return line;
    if (trimmed.startsWith(prefix.trim())) return line;
    const leading = line.slice(0, line.length - trimmed.length);
    return `${leading}${prefix}${trimmed}`;
  });

  const nextBlock = lines.join("\n");
  const nextValue = value.slice(0, lineStart) + nextBlock + value.slice(blockEnd);
  return {
    value: nextValue,
    selection: { start: lineStart, end: lineStart + nextBlock.length },
  };
}

function insertMarkdownSnippet(value, selection, snippet) {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const nextValue = value.slice(0, start) + snippet + value.slice(end);
  const cursor = start + snippet.length;
  return { value: nextValue, selection: { start: cursor, end: cursor } };
}

function insertMarkdownLink(value, selection) {
  const { start, end } = clampSelection(value, selection.start, selection.end);
  const label = value.slice(start, end) || "link text";
  const snippet = `[${label}](https://)`;
  const nextValue = value.slice(0, start) + snippet + value.slice(end);
  const urlStart = start + label.length + 3;
  const urlEnd = urlStart + 8;
  return { value: nextValue, selection: { start: urlStart, end: urlEnd } };
}

function testBoldWrap() {
  const checks = [];
  const result = wrapMarkdownSelection("Hello world", { start: 6, end: 11 }, "**", "**");
  if (result.value !== "Hello **world**") {
    checks.push(`unexpected value: ${result.value}`);
  }
  return { pass: checks.length === 0, checks };
}

function testHeadingPrefix() {
  const checks = [];
  const result = insertMarkdownPrefix(
    "Title\nBody line",
    { start: 6, end: 6 },
    "## ",
  );
  if (!result.value.includes("## Body line")) {
    checks.push("expected heading prefix on selected line");
  }
  return { pass: checks.length === 0, checks };
}

function testTableSnippet() {
  const checks = [];
  const snippet = "| A | B |\n| --- | --- |\n| 1 | 2 |\n";
  const result = insertMarkdownSnippet("Intro\n", { start: 6, end: 6 }, snippet);
  if (!result.value.includes("| A | B |")) {
    checks.push("expected table snippet insertion");
  }
  return { pass: checks.length === 0, checks };
}

function testLinkInsertion() {
  const checks = [];
  const result = insertMarkdownLink("Click here now", { start: 0, end: 10 });
  if (result.value !== "[Click here](https://) now") {
    checks.push(`unexpected link value: ${result.value}`);
  }
  if (result.selection.start !== 13 || result.selection.end !== 21) {
    checks.push("expected URL selection range");
  }
  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["bold-wrap", testBoldWrap()],
    ["heading-prefix", testHeadingPrefix()],
    ["table-snippet", testTableSnippet()],
    ["link-insertion", testLinkInsertion()],
  ];

  console.log("Worksheet editor tests\n");

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