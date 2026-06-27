#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL ?? "https://ida-chatbot.vercel.app";

const CASES = [
  {
    name: "handoff-trigger",
    label: "Mulai konsultasi → trigger_handoff tool",
    query: "Saya ingin mulai konsultasi dengan tim Anda sekarang",
    expectHandoffTriggered: true,
    expectToolCall: "trigger_handoff",
    expectReplyPattern: /handoff|tim manusia|konsultasi/i,
  },
  {
    name: "normal-chat",
    label: "Pertanyaan umum → tanpa tool handoff",
    query: "Apa itu IDA dan apa yang bisa kamu bantu?",
    expectHandoffTriggered: false,
    expectToolCall: undefined,
    expectReplyPattern: /ida|asisten|bantu/i,
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

function evaluateCase(testCase, meta, reply) {
  const checks = [];
  const handoffTriggered = meta?.handoffTriggered === true;

  if (handoffTriggered !== testCase.expectHandoffTriggered) {
    checks.push(
      `handoffTriggered expected ${testCase.expectHandoffTriggered}, got ${handoffTriggered}`,
    );
  }

  if (testCase.expectToolCall && meta?.toolCall !== testCase.expectToolCall) {
    checks.push(
      `toolCall expected ${testCase.expectToolCall}, got ${meta?.toolCall ?? "undefined"}`,
    );
  }

  if (!testCase.expectToolCall && meta?.toolCall) {
    checks.push(`toolCall expected undefined, got ${meta.toolCall}`);
  }

  if (testCase.expectHandoffTriggered && !meta?.handoffPrefill?.topic) {
    checks.push("handoffPrefill.topic missing");
  }

  if (!testCase.expectReplyPattern.test(reply)) {
    checks.push("reply content did not match expected pattern");
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  console.log(`Handoff tool test @ ${BASE_URL}\n`);

  const results = [];

  for (const [index, testCase] of CASES.entries()) {
    const { meta, reply } = await callChat(
      testCase.query,
      `ida-handoff-test-${index + 1}`,
    );
    const evaluation = evaluateCase(testCase, meta, reply);

    results.push({
      case: testCase.name,
      pass: evaluation.pass,
      meta: {
        handoffTriggered: meta?.handoffTriggered ?? false,
        toolCall: meta?.toolCall,
        toolCallReason: meta?.toolCallReason,
        handoffTopic: meta?.handoffPrefill?.topic,
      },
      checks: evaluation.checks,
    });

    console.log(`=== ${testCase.name}: ${testCase.label} ===`);
    console.log(`query: ${testCase.query}`);
    console.log(`meta: ${JSON.stringify(results.at(-1).meta)}`);
    console.log(`reply: ${reply.slice(0, 200)}${reply.length > 200 ? "..." : ""}`);
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

  if (passed < results.length) process.exit(1);
}

main().catch((error) => {
  console.error("HANDOFF_TOOL_FAILED:", error.message);
  process.exit(1);
});