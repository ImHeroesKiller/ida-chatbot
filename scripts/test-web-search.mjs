#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const CASES = [
  {
    name: "realtime-query",
    label: "Pertanyaan real-time → web search",
    query: "Berapa harga emas hari ini?",
    expectWebSearch: true,
    expectReplyPattern: /emas|gold|harga|rp|usd|sumber|source/i,
  },
  {
    name: "rag-general",
    label: "Pertanyaan umum → tanpa web search wajib",
    query: "Apa itu IDA dan apa yang bisa kamu bantu?",
    expectWebSearch: false,
    expectReplyPattern: /ida|asisten|bantu/i,
  },
  {
    name: "mixed-query",
    label: "Pertanyaan campuran (umum + konteks)",
    query: "Jelaskan apa itu IDA, lalu berikan ringkasan berita teknologi terbaru hari ini",
    expectWebSearch: true,
    expectReplyPattern: /ida|teknologi|berita|hari ini|sumber|source/i,
  },
];

async function consumeSse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let meta;
  let done;
  let reply = "";

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

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
      if (eventType === "token") reply += payload.text ?? "";
      if (eventType === "done") {
        done = payload;
        reply = payload.message || reply;
      }
      if (eventType === "error") {
        throw new Error(payload.error ?? "SSE error");
      }
    }
  }

  return { meta, done, reply: reply.trim() };
}

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

  return consumeSse(response);
}

function passed(condition, message) {
  console.log(condition ? `  ✓ ${message}` : `  ✗ ${message}`);
  return condition;
}

async function main() {
  console.log(`Testing IDA web search against ${BASE_URL}\n`);

  let failures = 0;

  for (const testCase of CASES) {
    console.log(`▶ ${testCase.label}`);
    const sessionId = `test-web-${testCase.name}-${Date.now()}`;

    try {
      const { meta, done, reply } = await callChat(testCase.query, sessionId);
      const usedWebSearch = Boolean(
        meta?.usedWebSearch || done?.usedWebSearch,
      );
      const sourceCount =
        done?.webSearchSources?.length ?? meta?.webSearchSources?.length ?? 0;

      if (
        !passed(reply.length > 20, `reply length > 20 (${reply.length})`)
      ) {
        failures += 1;
      }

      if (
        !passed(
          testCase.expectReplyPattern.test(reply),
          `reply matches expected pattern`,
        )
      ) {
        failures += 1;
        console.log(`    reply preview: ${reply.slice(0, 180)}...`);
      }

      if (testCase.expectWebSearch) {
        if (
          !passed(
            usedWebSearch || sourceCount > 0,
            `web search used (meta=${usedWebSearch}, sources=${sourceCount})`,
          )
        ) {
          failures += 1;
        }
      } else if (
        !passed(
          !usedWebSearch || sourceCount === 0,
          `web search not required (used=${usedWebSearch}, sources=${sourceCount})`,
        )
      ) {
        failures += 1;
      }
    } catch (error) {
      failures += 1;
      console.log(`  ✗ ${error instanceof Error ? error.message : error}`);
    }

    console.log("");
  }

  if (failures > 0) {
    console.error(`Failed ${failures} assertion(s).`);
    process.exit(1);
  }

  console.log("All web search chat tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});