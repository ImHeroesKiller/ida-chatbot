#!/usr/bin/env node

import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({ gfm: true, breaks: true });

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});
turndown.use(gfm);

function markdownToHtml(markdown) {
  return marked.parse(markdown.trim(), { async: false });
}

function htmlToMarkdown(html) {
  return turndown.turndown(html).trim();
}

function testHeadingRoundtrip() {
  const checks = [];
  const source = "## Section\n\nParagraph text.";
  const html = markdownToHtml(source);
  const roundtrip = htmlToMarkdown(html);

  if (!html.includes("<h2")) checks.push("expected h2 in html");
  if (!roundtrip.includes("## Section")) checks.push("expected heading in roundtrip");

  return { pass: checks.length === 0, checks };
}

function testListRoundtrip() {
  const checks = [];
  const source = "- Item one\n- Item two";
  const roundtrip = htmlToMarkdown(markdownToHtml(source));

  if (!roundtrip.includes("Item one") || !/^-\s+Item one/m.test(roundtrip)) {
    checks.push("expected bullet list in roundtrip");
  }

  return { pass: checks.length === 0, checks };
}

function testTableRoundtrip() {
  const checks = [];
  const source = "| A | B |\n| --- | --- |\n| 1 | 2 |";
  const roundtrip = htmlToMarkdown(markdownToHtml(source));

  if (!roundtrip.includes("| A | B |")) {
    checks.push("expected table in roundtrip");
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["heading-roundtrip", testHeadingRoundtrip()],
    ["list-roundtrip", testListRoundtrip()],
    ["table-roundtrip", testTableRoundtrip()],
  ];

  console.log("Worksheet markdown convert tests\n");

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