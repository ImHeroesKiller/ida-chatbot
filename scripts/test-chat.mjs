#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

async function callChat(messages, sessionId = "ida-test-session-001") {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "id",
      sessionId,
      messages,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  if (!contentType.includes("text/event-stream")) {
    throw new Error(`Expected SSE, got ${contentType}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let meta;
  let message = "";

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
      if (eventType === "token") message += payload.text;
      if (eventType === "done") message = payload.message || message;
      if (eventType === "error") throw new Error(payload.error);
    }
  }

  return { meta, message: message.trim() };
}

async function main() {
  console.log(`Testing IDA chat at ${BASE_URL}\n`);

  console.log("=== Query 1: intro ===");
  const q1 = await callChat([
    { role: "user", content: "Halo IDA, siapa kamu dan apa yang bisa kamu bantu?" },
  ]);
  console.log("meta:", JSON.stringify(q1.meta));
  console.log("reply:", q1.message.slice(0, 220) + (q1.message.length > 220 ? "..." : ""));
  console.log("streaming:", q1.message.length > 0 ? "OK" : "FAIL");

  console.log("\n=== Query 2: memory follow-up ===");
  const q2 = await callChat([
    { role: "user", content: "Halo IDA, siapa kamu dan apa yang bisa kamu bantu?" },
    { role: "assistant", content: q1.message },
    { role: "user", content: "Ingat topik tadi — sebutkan kembali nama kamu dalam satu kalimat singkat." },
  ]);
  console.log("meta:", JSON.stringify(q2.meta));
  console.log("reply:", q2.message.slice(0, 220) + (q2.message.length > 220 ? "..." : ""));
  const memoryOk = /ida/i.test(q2.message);
  console.log("memory:", memoryOk ? "OK (mentions IDA)" : "CHECK");

  console.log("\n=== Summary ===");
  console.log({
    streaming: q1.message.length > 0,
    rag: q1.meta?.usedRag ?? false,
    retrievedChunks: q1.meta?.retrievedChunks ?? 0,
    memory: memoryOk,
    handoffPrefill: Boolean(q2.meta?.handoffPrefill?.topic),
  });
}

main().catch((error) => {
  console.error("TEST_FAILED:", error.message);
  process.exit(1);
});