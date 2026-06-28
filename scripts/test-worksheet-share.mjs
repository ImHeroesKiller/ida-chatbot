#!/usr/bin/env node

const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function createSharedWorksheet(store, params) {
  const title = params.title.trim().slice(0, 200) || "Document";
  const content = params.content.trim();
  if (!content) throw new Error("Worksheet content is empty.");

  const now = Date.now();
  const record = {
    id: "test-share-id",
    title,
    content,
    locale: params.locale,
    createdAt: now,
    expiresAt: now + SHARE_TTL_MS,
  };

  store.set(record.id, record);
  return record;
}

function getSharedWorksheet(store, id) {
  const record = store.get(id);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    store.delete(id);
    return null;
  }
  return record;
}

function testCreateAndReadShare() {
  const checks = [];
  const store = new Map();
  const created = createSharedWorksheet(store, {
    title: "Proposal",
    content: "# Proposal\n\nBody",
    locale: "id",
  });

  const loaded = getSharedWorksheet(store, created.id);
  if (!loaded) checks.push("expected share record");
  if (loaded?.title !== "Proposal") checks.push("unexpected title");
  if (!loaded?.content.includes("# Proposal")) checks.push("expected content");

  return { pass: checks.length === 0, checks };
}

function testRejectEmptyContent() {
  const checks = [];
  const store = new Map();

  try {
    createSharedWorksheet(store, { title: "X", content: "   ", locale: "en" });
    checks.push("expected empty content rejection");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("empty")) {
      checks.push("unexpected error message");
    }
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["create-read-share", testCreateAndReadShare()],
    ["reject-empty-content", testRejectEmptyContent()],
  ];

  console.log("Worksheet share tests\n");

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