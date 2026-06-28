#!/usr/bin/env node

/**
 * Unit tests for chat-store pure logic (no browser localStorage).
 */

function deriveChatTitle(messages, locale) {
  const fallback = { id: "Chat baru", en: "New chat", zh: "新对话" };
  const conversation = messages.filter((m) => m.id !== "ida-welcome");
  const userMessages = conversation.filter(
    (m) => m.role === "user" && m.content.trim(),
  );
  const assistantMessages = conversation.filter(
    (m) => m.role === "assistant" && m.content.trim(),
  );

  if (userMessages.length < 2 || assistantMessages.length < 2) {
    return fallback[locale];
  }

  const cleaned = userMessages[0].content
    .trim()
    .replace(/^(bantu|tolong|please|help me)\s+/i, "")
    .replace(/^(buatkan|buat|create|make)\s+(saya\s+)?/i, "")
    .replace(/[?.!]+$/, "");
  const words = cleaned.split(/\s+/).slice(0, 7);
  return words
    .map((word) => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => {
    const aPinned = Boolean(a.pinned);
    const bPinned = Boolean(b.pinned);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
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
        pinned: false,
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
        pinned: true,
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
  const earlyTitle = deriveChatTitle(
    [
      { id: "u1", role: "user", content: "Bagaimana cara mulai konsultasi?" },
      { id: "a1", role: "assistant", content: "Berikut langkahnya..." },
    ],
    "id",
  );

  if (earlyTitle !== "Chat baru") {
    checks.push(`expected generic title before 2 exchanges, got "${earlyTitle}"`);
  }

  const title = deriveChatTitle(
    [
      { id: "u1", role: "user", content: "Bantu buatkan proposal proyek PLTS" },
      { id: "a1", role: "assistant", content: "Berikut struktur proposal..." },
      { id: "u2", role: "user", content: "Untuk rooftop komersial" },
      { id: "a2", role: "assistant", content: "Baik, untuk rooftop..." },
    ],
    "id",
  );

  if (title !== "Proposal Proyek PLTS") {
    checks.push(`expected cleaned title, got "${title}"`);
  }

  const fallback = deriveChatTitle([], "id");
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

function testSortSessionsPinnedFirst() {
  const sessions = [
    { id: "a", title: "A", updatedAt: 100, pinned: false },
    { id: "b", title: "B", updatedAt: 50, pinned: true },
    { id: "c", title: "C", updatedAt: 200, pinned: false },
    { id: "d", title: "D", updatedAt: 10, pinned: true },
  ];

  const sorted = sortSessions(sessions);
  const checks = [];

  if (sorted[0].id !== "b") {
    checks.push(`expected pinned b first, got ${sorted[0].id}`);
  }
  if (sorted[1].id !== "d") {
    checks.push(`expected pinned d second, got ${sorted[1].id}`);
  }
  if (sorted[2].id !== "c") {
    checks.push(`expected unpinned c third, got ${sorted[2].id}`);
  }

  return { pass: checks.length === 0, checks };
}

function testChatStoreScopeKeys() {
  const checks = [];

  function getChatStoreStorageKey(scope) {
    if (scope.kind === "authenticated") {
      return `ida-chat-store:user:${scope.userId}`;
    }
    return `ida-chat-store:anonymous:${scope.deviceId}`;
  }

  function resolveChatStoreScope({ authUserId, anonymousDeviceId }) {
    if (authUserId) return { kind: "authenticated", userId: authUserId };
    return { kind: "anonymous", deviceId: anonymousDeviceId };
  }

  const userA = resolveChatStoreScope({
    authUserId: "11111111-1111-4111-8111-111111111111",
    anonymousDeviceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  });
  const userB = resolveChatStoreScope({
    authUserId: "22222222-2222-4222-8222-222222222222",
    anonymousDeviceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  });
  const anon = resolveChatStoreScope({
    authUserId: null,
    anonymousDeviceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  });

  const keyA = getChatStoreStorageKey(userA);
  const keyB = getChatStoreStorageKey(userB);
  const keyAnon = getChatStoreStorageKey(anon);

  if (keyA === keyB) checks.push("user A and B must have different storage keys");
  if (keyA === keyAnon) checks.push("authenticated and anonymous keys must differ");
  if (!keyA.includes("user:11111111")) checks.push("user A key must include user id");
  if (!keyAnon.includes("anonymous:aaaaaaaa")) {
    checks.push("anonymous key must include device id");
  }

  return { pass: checks.length === 0, checks };
}

function testMeaningfulHistoryDetection() {
  const checks = [];

  function hasMeaningfulChatHistory(store) {
    if (store.order.length > 1) return true;
    const current = store.chats[store.currentChatId];
    if (!current) return false;
    return current.messages.some(
      (message) =>
        message.role === "user" &&
        message.id !== "ida-welcome" &&
        message.content.trim().length > 0,
    );
  }

  const empty = {
    currentChatId: "c1",
    order: ["c1"],
    chats: {
      c1: {
        messages: [{ id: "ida-welcome", role: "assistant", content: "Hi" }],
      },
    },
  };

  const withUser = {
    currentChatId: "c1",
    order: ["c1"],
    chats: {
      c1: {
        messages: [
          { id: "ida-welcome", role: "assistant", content: "Hi" },
          { id: "u1", role: "user", content: "Halo" },
        ],
      },
    },
  };

  if (hasMeaningfulChatHistory(empty)) {
    checks.push("welcome-only store should not be meaningful");
  }
  if (!hasMeaningfulChatHistory(withUser)) {
    checks.push("store with user message should be meaningful");
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  const cases = [
    { name: "derive-title", ...testDeriveTitle() },
    { name: "store-roundtrip", ...simulateStoreRoundtrip() },
    { name: "switch-session", ...testMultiSessionSwitch() },
    { name: "sort-pinned", ...testSortSessionsPinnedFirst() },
    { name: "scope-keys", ...testChatStoreScopeKeys() },
    { name: "meaningful-history", ...testMeaningfulHistoryDetection() },
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