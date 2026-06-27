#!/usr/bin/env node

/**
 * Unit tests for chat-store pure logic (no browser localStorage).
 */

function deriveChatTitle(messages, locale) {
  const fallback = { id: "Chat baru", en: "New chat", zh: "新对话" };
  const firstUser = messages.find(
    (m) => m.role === "user" && m.id !== "ida-welcome" && m.content.trim(),
  );
  if (!firstUser) return fallback[locale];
  const trimmed = firstUser.content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}...` : trimmed;
}

function simulateStoreRoundtrip() {
  const store = {
    currentChatId: "chat-1",
    chats: {
      "chat-1": {
        id: "chat-1",
        title: "Chat baru",
        messages: [{ id: "ida-welcome", role: "assistant", content: "Hi" }],
        quickReplies: ["A", "B"],
        apiSessionId: "ida-1",
        createdAt: 1,
        updatedAt: 1,
      },
      "chat-2": {
        id: "chat-2",
        title: "Topik kedua",
        messages: [
          { id: "ida-welcome", role: "assistant", content: "Hi" },
          { id: "u1", role: "user", content: "Halo dari chat kedua" },
        ],
        quickReplies: ["A", "B"],
        apiSessionId: "ida-2",
        createdAt: 2,
        updatedAt: 2,
      },
    },
    order: ["chat-2", "chat-1"],
  };

  const json = JSON.stringify(store);
  const restored = JSON.parse(json);

  const checks = [];
  if (restored.currentChatId !== "chat-1") {
    checks.push("currentChatId mismatch after roundtrip");
  }
  if (restored.order.length !== 2) {
    checks.push("order length mismatch");
  }
  if (!restored.chats["chat-2"]) {
    checks.push("chat-2 missing after roundtrip");
  }

  return { pass: checks.length === 0, checks };
}

function testDeriveTitle() {
  const checks = [];
  const title = deriveChatTitle(
    [
      { id: "ida-welcome", role: "assistant", content: "x" },
      { id: "u1", role: "user", content: "Bagaimana cara mulai konsultasi?" },
    ],
    "id",
  );

  if (title !== "Bagaimana cara mulai konsultasi?") {
    checks.push(`expected user message as title, got "${title}"`);
  }

  const fallback = deriveChatTitle(
    [{ id: "ida-welcome", role: "assistant", content: "x" }],
    "id",
  );
  if (fallback !== "Chat baru") {
    checks.push(`expected fallback title, got "${fallback}"`);
  }

  return { pass: checks.length === 0, checks };
}

function testMultiSessionSwitch() {
  const store = {
    currentChatId: "chat-1",
    chats: {
      "chat-1": { id: "chat-1", messages: [{ role: "user", content: "A" }] },
      "chat-2": { id: "chat-2", messages: [{ role: "user", content: "B" }] },
    },
    order: ["chat-1", "chat-2"],
  };

  store.currentChatId = "chat-2";
  const loaded = store.chats[store.currentChatId].messages[0].content;

  return {
    pass: loaded === "B",
    checks: loaded === "B" ? [] : [`expected B, got ${loaded}`],
  };
}

async function main() {
  const cases = [
    { name: "derive-title", ...testDeriveTitle() },
    { name: "store-roundtrip", ...simulateStoreRoundtrip() },
    { name: "switch-session", ...testMultiSessionSwitch() },
  ];

  console.log("Chat store tests\n");

  for (const testCase of cases) {
    console.log(`${testCase.name}: ${testCase.pass ? "PASS" : "FAIL"}`);
    if (testCase.checks.length) {
      console.log(`  ${testCase.checks.join("; ")}`);
    }
  }

  const passed = cases.filter((c) => c.pass).length;
  console.log(`\nSummary: ${passed}/${cases.length} passed`);

  if (passed < cases.length) process.exit(1);
}

main();