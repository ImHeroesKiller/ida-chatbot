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
    'import { getWorkflowAnalytics } from "./lib/admin/workflow-analytics.ts"; ' +
      "getWorkflowAnalytics().then((analytics) => console.log(JSON.stringify({ " +
      "hasOverview: Boolean(analytics.overview), " +
      "dailyPoints: analytics.dailyExecutions.length, " +
      "perWorkflowIsArray: Array.isArray(analytics.perWorkflow), " +
      "agentPerfIsArray: Array.isArray(analytics.agentPerformance), " +
      "logsIsArray: Array.isArray(analytics.executionLogs) " +
      "})));",
  )}`,
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const result = JSON.parse(output.trim());

assert(result.hasOverview === true, "analytics returns overview");
assert(result.dailyPoints === 7, "analytics returns 7 daily chart points");
assert(result.perWorkflowIsArray === true, "perWorkflow is array");
assert(result.agentPerfIsArray === true, "agentPerformance is array");
assert(result.logsIsArray === true, "executionLogs is array");

console.log("PASS: workflow analytics aggregator shape");
console.log("\nAll workflow analytics tests passed.");