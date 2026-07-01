#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const WORKFLOW_TESTS = [
  "test:workflow-persistence",
  "test:workflow-execute-stream",
  "test:workflow-actions",
  "test:workflow-templates",
  "test:workflow-analytics",
  "test:workflow-security",
  "test:workflow-scheduler",
  "test:workflow-feedback",
];

let passed = 0;
let failed = 0;

console.log("Running Phase 3 workflow test suite…\n");

for (const script of WORKFLOW_TESTS) {
  process.stdout.write(`→ ${script} … `);
  const result = spawnSync("npm", ["run", script], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) {
    passed += 1;
    console.log("OK");
  } else {
    failed += 1;
    console.log("FAIL");
    if (result.stdout?.trim()) console.log(result.stdout.trim());
    if (result.stderr?.trim()) console.error(result.stderr.trim());
  }
}

console.log(`\nWorkflow suite: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}

console.log("All workflow tests passed.");