#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL ?? "https://ida-chatbot.vercel.app";

const CONFIDENCE_CASES = [
  {
    name: "rag-good",
    label: "RAG bagus (similarity >= 0.75)",
    query: "Siapa IDA dan apa kepanjangan namanya?",
    expectUsedRag: true,
    expectFallbackReason: undefined,
    minMaxSimilarity: 0.75,
  },
  {
    name: "rag-weak",
    label: "RAG lemah (chunks ada, similarity 0.50–0.75)",
    query:
      "Berapa harga langganan streaming film dan serial TV per bulan di platform digital?",
    expectUsedRag: false,
    expectFallbackReason: "low_confidence",
    minMaxSimilarity: 0.5,
    maxMaxSimilarity: 0.75,
    minRetrievedChunks: 1,
  },
  {
    name: "rag-failed",
    label: "RAG gagal (match sangat rendah, pure LLM fallback)",
    query:
      "Resep lengkap kue bolu coklat tanpa oven untuk 20 orang dengan topping keju?",
    expectUsedRag: false,
    allowedFallbackReasons: ["no_chunks", "low_confidence"],
    maxMaxSimilarity: 0.5,
  },
];

async function callChat(query, sessionId) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "id",
      sessionId,
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let meta;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const lines = block.split("\n");
      let eventType = "message";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        if (line.startsWith("data:")) dataLine = line.slice(5).trim();
      }

      if (!dataLine) continue;
      const payload = JSON.parse(dataLine);
      if (eventType === "meta") meta = payload;
      if (eventType === "error") throw new Error(payload.error);
    }
  }

  return meta;
}

function evaluateCase(testCase, meta) {
  const usedRag = meta?.usedRag === true;
  const retrievedChunks = meta?.retrievedChunks ?? 0;
  const maxSimilarity = meta?.maxSimilarity ?? 0;
  const fallbackReason = meta?.ragFallbackReason;

  const checks = [];

  if (usedRag !== testCase.expectUsedRag) {
    checks.push(
      `usedRag expected ${testCase.expectUsedRag}, got ${usedRag}`,
    );
  }

  if (testCase.expectFallbackReason && fallbackReason !== testCase.expectFallbackReason) {
    checks.push(
      `fallbackReason expected ${testCase.expectFallbackReason}, got ${fallbackReason ?? "undefined"}`,
    );
  }

  if (
    testCase.allowedFallbackReasons &&
    !testCase.allowedFallbackReasons.includes(fallbackReason)
  ) {
    checks.push(
      `fallbackReason expected one of ${testCase.allowedFallbackReasons.join(", ")}, got ${fallbackReason ?? "undefined"}`,
    );
  }

  if (
    testCase.minMaxSimilarity !== undefined &&
    maxSimilarity < testCase.minMaxSimilarity
  ) {
    checks.push(
      `maxSimilarity expected >= ${testCase.minMaxSimilarity}, got ${maxSimilarity}`,
    );
  }

  if (
    testCase.maxMaxSimilarity !== undefined &&
    maxSimilarity >= testCase.maxMaxSimilarity
  ) {
    checks.push(
      `maxSimilarity expected < ${testCase.maxMaxSimilarity}, got ${maxSimilarity}`,
    );
  }

  if (
    testCase.minRetrievedChunks !== undefined &&
    retrievedChunks < testCase.minRetrievedChunks
  ) {
    checks.push(
      `retrievedChunks expected >= ${testCase.minRetrievedChunks}, got ${retrievedChunks}`,
    );
  }

  if (
    testCase.maxRetrievedChunks !== undefined &&
    retrievedChunks > testCase.maxRetrievedChunks
  ) {
    checks.push(
      `retrievedChunks expected <= ${testCase.maxRetrievedChunks}, got ${retrievedChunks}`,
    );
  }

  return {
    pass: checks.length === 0,
    checks,
  };
}

async function main() {
  console.log(`RAG confidence threshold test @ ${BASE_URL}\n`);

  const results = [];

  for (const [index, testCase] of CONFIDENCE_CASES.entries()) {
    const sessionId = `ida-rag-confidence-${index + 1}`;
    const meta = await callChat(testCase.query, sessionId);
    const evaluation = evaluateCase(testCase, meta);

    results.push({
      case: testCase.name,
      label: testCase.label,
      pass: evaluation.pass,
      meta: {
        usedRag: meta?.usedRag ?? false,
        retrievedChunks: meta?.retrievedChunks ?? 0,
        maxSimilarity: meta?.maxSimilarity ?? 0,
        ragFallbackReason: meta?.ragFallbackReason,
      },
      checks: evaluation.checks,
    });

    console.log(`=== ${testCase.name}: ${testCase.label} ===`);
    console.log(`query: ${testCase.query}`);
    console.log(`meta: ${JSON.stringify(results.at(-1).meta)}`);
    console.log(`result: ${evaluation.pass ? "PASS" : "FAIL"}`);
    if (evaluation.checks.length) {
      console.log(`checks: ${evaluation.checks.join("; ")}`);
    }
    console.log();
  }

  const passed = results.filter((r) => r.pass).length;
  const summary = { total: results.length, passed, failed: results.length - passed, cases: results };

  console.log("=== Summary ===");
  console.log(JSON.stringify(summary, null, 2));

  if (passed < results.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("RAG_CONFIDENCE_FAILED:", error.message);
  process.exit(1);
});