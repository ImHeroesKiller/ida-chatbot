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
    'import { buildCronExpression, computeNextRunAt, formatScheduleLabel, isCronScheduleType, isEventScheduleType, parseTriggerSchedule } from "./lib/workflow-scheduler/index.ts"; ' +
      "const monthly = { type: 'monthly', dayOfMonth: 15, hour: 10 }; " +
      "const webhook = { type: 'event_webhook' }; " +
      "const triggerNode = { id: 't1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'Trigger', kind: 'trigger', config: { schedule: monthly } } }; " +
      "const parsed = parseTriggerSchedule(triggerNode); " +
      "const nextMonthly = computeNextRunAt(monthly, Date.parse('2026-07-02T12:00:00Z')); " +
      "console.log(JSON.stringify({ " +
      "parsedType: parsed.type, " +
      "parsedDom: parsed.dayOfMonth, " +
      "cronMonthly: buildCronExpression(monthly), " +
      "monthlyLabel: formatScheduleLabel(monthly, 'en'), " +
      "webhookLabel: formatScheduleLabel(webhook, 'en'), " +
      "isCron: isCronScheduleType('monthly'), " +
      "isEvent: isEventScheduleType('event_email'), " +
      "nextMonthlyFuture: nextMonthly !== null && nextMonthly > Date.parse('2026-07-02T12:00:00Z'), " +
      "webhookNextNull: computeNextRunAt(webhook) === null " +
      "}));",
  )}`,
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const result = JSON.parse(output.trim());

assert(result.parsedType === "monthly", "parseTriggerSchedule reads monthly");
assert(result.parsedDom === 15, "dayOfMonth preserved");
assert(result.cronMonthly === "0 10 15 * *", "monthly cron expression");
assert(result.monthlyLabel.includes("15"), "monthly label includes day");
assert(result.webhookLabel === "Webhook", "webhook label");
assert(result.isCron === true, "monthly is cron type");
assert(result.isEvent === true, "event_email is event type");
assert(result.nextMonthlyFuture === true, "monthly next run in future");
assert(result.webhookNextNull === true, "event triggers have no next run");

console.log("PASS: workflow scheduler helpers");
console.log("\nAll workflow scheduler tests passed.");