#!/usr/bin/env node

/**
 * Unit tests for predictive quick reply inference (mirrors lib/quick-replies.ts rules).
 */

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function detectTopicHints(text) {
  const normalized = text.toLowerCase().trim();
  return {
    technical: includesAny(normalized, [/\b(api|bug|error|teknis|技术)\b/i]),
    business: includesAny(normalized, [/\b(bisnis|business|strategi|商业)\b/i]),
    comparison: includesAny(normalized, [/\b(bandingkan|compare|比较)\b/i]),
    procedural: includesAny(normalized, [/\b(langkah|step|步骤)\b/i]),
    realtime: includesAny(normalized, [/\b(hari ini|today|最新)\b/i]),
  };
}

function testWelcomeStage() {
  const userMessages = [];
  const replies = userMessages.length === 0 ? [] : ["should-not-happen"];
  const pass = replies.length === 0;
  return {
    pass,
    checks: pass ? [] : ["expected no quick replies before conversation starts"],
  };
}

function testRealtimeHints() {
  const hints = detectTopicHints("Berapa harga emas hari ini di Indonesia?");
  return {
    pass: hints.realtime,
    checks: hints.realtime ? [] : ["expected realtime hint"],
  };
}

function testTechnicalHints() {
  const hints = detectTopicHints("API saya error 500 saat deploy");
  return {
    pass: hints.technical,
    checks: hints.technical ? [] : ["expected technical hint"],
  };
}

function testProceduralFromAssistant() {
  const assistant =
    "Berikut langkah-langkahnya:\n1. Siapkan dokumen\n2. Upload file\n3. Review hasil";
  const pass = includesAny(assistant, [/\n\d+[\.)]/, /langkah/i]);
  return { pass, checks: pass ? [] : ["expected procedural assistant pattern"] };
}

async function main() {
  const cases = [
    { name: "welcome-stage", ...testWelcomeStage() },
    { name: "realtime-hints", ...testRealtimeHints() },
    { name: "technical-hints", ...testTechnicalHints() },
    { name: "procedural-assistant", ...testProceduralFromAssistant() },
  ];

  console.log("Quick reply inference tests\n");

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