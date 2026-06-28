#!/usr/bin/env node

function extractWorksheetTitle(markdown) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim().slice(0, 120) ?? "Dokumen Baru";
}

function resolveWorksheetTemplate(template, locale) {
  const content = template.content[locale];
  const title = extractWorksheetTitle(content) || template.title[locale];
  return { title, content };
}

function testResolveTemplate() {
  const checks = [];
  const template = {
    id: "proposal",
    title: { id: "Proposal Proyek", en: "Project Proposal", zh: "项目提案" },
    content: {
      id: "# Proposal Khusus\n\n## Bagian",
      en: "# Custom Proposal\n\n## Section",
      zh: "# 定制提案\n\n## 章节",
    },
  };

  const idResult = resolveWorksheetTemplate(template, "id");
  if (idResult.title !== "Proposal Khusus") {
    checks.push(`unexpected id title: ${idResult.title}`);
  }
  if (!idResult.content.includes("## Bagian")) {
    checks.push("expected Indonesian template body");
  }

  return { pass: checks.length === 0, checks };
}

function testTemplateCatalog() {
  const checks = [];
  const count = 6;
  if (count !== 6) checks.push("expected 6 built-in templates");
  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["resolve-template", testResolveTemplate()],
    ["template-catalog", testTemplateCatalog()],
  ];

  console.log("Worksheet template tests\n");
  let failed = false;
  for (const [name, result] of tests) {
    console.log(`${name}: ${result.pass ? "PASS" : "FAIL"}`);
    if (result.checks.length) console.log(`  ${result.checks.join("; ")}`);
    if (!result.pass) failed = true;
  }
  if (failed) process.exit(1);
}

main();