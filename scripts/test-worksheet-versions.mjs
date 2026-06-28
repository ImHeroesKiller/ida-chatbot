#!/usr/bin/env node

const MAX_WORKSHEET_VERSIONS = 20;

function createWorksheetVersion(params) {
  return {
    id: `wv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: params.title.trim(),
    content: params.content,
    createdAt: Date.now(),
    source: params.source,
  };
}

function shouldRecordWorksheetVersion(versions, title, content) {
  const trimmed = content.trim();
  if (!trimmed) return false;
  const latest = versions?.[0];
  if (!latest) return true;
  return latest.content !== content || latest.title.trim() !== title.trim();
}

function pushWorksheetVersion(versions, version) {
  return [version, ...(versions ?? [])].slice(0, MAX_WORKSHEET_VERSIONS);
}

function recordWorksheetVersion(versions, params) {
  if (!shouldRecordWorksheetVersion(versions, params.title, params.content)) {
    return versions ?? [];
  }
  return pushWorksheetVersion(versions, createWorksheetVersion(params));
}

function testDedupesIdenticalVersion() {
  const checks = [];
  const versions = recordWorksheetVersion([], {
    title: "Doc",
    content: "# Hello",
    source: "generated",
  });
  const again = recordWorksheetVersion(versions, {
    title: "Doc",
    content: "# Hello",
    source: "manual_save",
  });

  if (again.length !== 1) checks.push("expected duplicate version to be skipped");
  return { pass: checks.length === 0, checks };
}

function testKeepsMaxVersions() {
  const checks = [];
  let versions = [];
  for (let i = 0; i < 25; i += 1) {
    versions = recordWorksheetVersion(versions, {
      title: `Doc ${i}`,
      content: `Content ${i}`,
      source: "manual_save",
    });
  }

  if (versions.length !== MAX_WORKSHEET_VERSIONS) {
    checks.push(`expected ${MAX_WORKSHEET_VERSIONS} versions, got ${versions.length}`);
  }
  if (versions[0]?.content !== "Content 24") {
    checks.push("expected newest version first");
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["dedupe-identical-version", testDedupesIdenticalVersion()],
    ["max-version-cap", testKeepsMaxVersions()],
  ];

  console.log("Worksheet version tests\n");
  let failed = false;
  for (const [name, result] of tests) {
    console.log(`${name}: ${result.pass ? "PASS" : "FAIL"}`);
    if (result.checks.length) console.log(`  ${result.checks.join("; ")}`);
    if (!result.pass) failed = true;
  }
  if (failed) process.exit(1);
}

main();