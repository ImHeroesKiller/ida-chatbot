#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const output = execSync(
  `npx --yes tsx -e ${JSON.stringify(
    'import { resolveWorkflowErrorMessage, resolveWorkflowExecutionToast } from "./lib/workflow-feedback.ts"; ' +
      "console.log(JSON.stringify({ " +
      "executeFailed: resolveWorkflowErrorMessage('en', { code: 'execute_failed' }), " +
      "rateLimit: resolveWorkflowErrorMessage('id', { httpStatus: 429 }), " +
      "custom: resolveWorkflowErrorMessage('en', { message: 'Node X failed' }), " +
      "successToast: resolveWorkflowExecutionToast('en', 'completed').type, " +
      "failToast: resolveWorkflowExecutionToast('en', 'failed').type " +
      "}));",
  )}`,
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const result = JSON.parse(output.trim());

assert(
  result.executeFailed.includes("failed"),
  "execute_failed message is user-friendly",
);
assert(result.rateLimit.includes("permintaan"), "429 maps to Indonesian copy");
assert(result.custom === "Node X failed", "custom message preserved");
assert(result.successToast === "success", "completed → success toast");
assert(result.failToast === "error", "failed → error toast");

console.log("PASS: workflow feedback helpers");
console.log("\nAll workflow feedback tests passed.");