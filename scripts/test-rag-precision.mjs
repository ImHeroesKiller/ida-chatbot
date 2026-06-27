#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL ?? "https://ida-chatbot.vercel.app";

const PRECISION_CASES = [
  {
    name: "identity",
    query: "Siapa IDA dan apa kepanjangan namanya?",
    expectSource: "faq",
    expectSection: "siapa-ida",
    keywords: [/intelligent digital assistant/i, /singkatan/i],
  },
  {
    name: "handoff",
    query: "Bagaimana cara menghubungi agen manusia untuk bantuan?",
    expectSource: "faq",
    expectSection: "bantuan-manusia",
    keywords: [/agen manusia/i, /handoff/i],
  },
  {
    name: "getting-started",
    query: "Jelaskan langkah memulai chat dengan IDA",
    expectSource: "panduan",
    expectSection: "mulai-chat",
    keywords: [/langkah/i, /quick repl/i],
  },
  {
    name: "capabilities",
    query: "Apa saja kemampuan utama IDA dalam layanan pelanggan?",
    expectSource: "tentang-ida",
    expectSection: "kemampuan",
    keywords: [/knowledge base/i, /layanan pelanggan/i, /faq/i],
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
  let reply = "";

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
      if (eventType === "token") reply += payload.text;
      if (eventType === "done") reply = payload.message || reply;
      if (eventType === "error") throw new Error(payload.error);
    }
  }

  return { meta, reply: reply.trim() };
}

function keywordMatch(reply, keywords) {
  return keywords.some((pattern) => pattern.test(reply));
}

async function main() {
  console.log(`RAG precision test @ ${BASE_URL}\n`);

  const results = [];

  for (const [index, testCase] of PRECISION_CASES.entries()) {
    const sessionId = `ida-rag-precision-${index + 1}`;
    const { meta, reply } = await callChat(testCase.query, sessionId);

    const usedRag = meta?.usedRag === true;
    const retrievedChunks = meta?.retrievedChunks ?? 0;
    const contentOk = keywordMatch(reply, testCase.keywords);
    const pass = usedRag && retrievedChunks > 0 && contentOk;

    results.push({
      case: testCase.name,
      usedRag,
      retrievedChunks,
      contentOk,
      pass,
      expect: `${testCase.expectSource}/${testCase.expectSection}`,
    });

    console.log(`=== ${testCase.name} ===`);
    console.log(`query: ${testCase.query}`);
    console.log(`meta: ${JSON.stringify({ usedRag, retrievedChunks })}`);
    console.log(`content match: ${contentOk ? "OK" : "CHECK"}`);
    console.log(`reply: ${reply.slice(0, 180)}${reply.length > 180 ? "..." : ""}`);
    console.log(`expect: ${testCase.expectSource}/${testCase.expectSection}`);
    console.log(`result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  const passed = results.filter((r) => r.pass).length;
  const summary = {
    total: results.length,
    passed,
    failed: results.length - passed,
    ragActive: results.every((r) => r.usedRag && r.retrievedChunks > 0),
    cases: results,
  };

  console.log("=== Summary ===");
  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ragActive || passed < results.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("RAG_PRECISION_FAILED:", error.message);
  process.exit(1);
});