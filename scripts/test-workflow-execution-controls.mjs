#!/usr/bin/env node

/**
 * Phase 2.5 tests: approval checkpoints, error recovery, scheduling helpers.
 */

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadModule() {
  const snippet =
    'import { applyResumeActionToCheckpoint, buildOrderedNodeIds, getNodeMaxRetries, suggestWorkflowErrorRecovery } from "./lib/workflow-execution-state.ts"; ' +
    'import { computeNextRunAt, formatScheduleLabel, parseTriggerSchedule } from "./lib/workflow-scheduler.ts"; ' +
    'import { buildWorkflowWorkspacePersistFingerprint } from "./lib/workflow.ts"; ' +
    "const workflow = { id: 'wf-1', name: 'Test', nodes: [ " +
    "{ id: 't1', type: 'default', position: { x: 0, y: 0 }, data: { label: 'Trigger', kind: 'trigger', config: { schedule: { type: 'delay', delayMs: 3000 } } } }, " +
    "{ id: 'a1', type: 'default', position: { x: 100, y: 0 }, data: { label: 'Action', kind: 'action', config: { maxRetries: 1 } } }, " +
    "{ id: 'ap1', type: 'default', position: { x: 200, y: 0 }, data: { label: 'Approve', kind: 'approval', prompt: 'Check output' } }, " +
    "{ id: 'o1', type: 'default', position: { x: 300, y: 0 }, data: { label: 'Output', kind: 'output' } } " +
    "], edges: [ " +
    "{ id: 'e1', source: 't1', target: 'a1' }, { id: 'e2', source: 'a1', target: 'ap1' }, { id: 'e3', source: 'ap1', target: 'o1' } " +
    "], createdAt: 1, updatedAt: 1 }; " +
    "const baseCheckpoint = { workflowId: 'wf-1', locale: 'en', startedAt: 1000, context: 'ctx', logs: [], nextNodeIndex: 2, orderedNodeIds: buildOrderedNodeIds(workflow), pauseReason: 'approval', pendingNodeId: 'ap1', pendingNodeLabel: 'Approve', pendingNodeKind: 'approval', approvalPrompt: 'Check output' }; " +
    "const approved = applyResumeActionToCheckpoint(baseCheckpoint, 'approve', 'ok'); " +
    "const rejected = applyResumeActionToCheckpoint(baseCheckpoint, 'reject'); " +
    "const recovery = { ...baseCheckpoint, pauseReason: 'recovery', pendingNodeId: 'a1', pendingNodeKind: 'action', pendingNodeLabel: 'Action', errorMessage: 'rate limit', errorSuggestion: suggestWorkflowErrorRecovery({ node: workflow.nodes[1], errorMessage: 'rate limit', locale: 'en' }), retryCount: 1, maxRetries: 1 }; " +
    "const skipped = applyResumeActionToCheckpoint(recovery, 'skip'); " +
    "const triggerNode = workflow.nodes[0]; " +
    "const schedule = parseTriggerSchedule(triggerNode); " +
    "const nextRun = computeNextRunAt({ type: 'daily', hour: 9 }, Date.parse('2026-07-02T08:00:00Z')); " +
    "const fingerprint = buildWorkflowWorkspacePersistFingerprint({ workflows: [workflow], activeWorkflowId: 'wf-1', updatedAt: 1, executionCheckpoint: baseCheckpoint }); " +
    "console.log(JSON.stringify({ ordered: buildOrderedNodeIds(workflow), maxRetries: getNodeMaxRetries(workflow.nodes[1]), approvedIndex: approved.nextNodeIndex, approvedLog: approved.logs[0]?.status, rejectedLog: rejected.logs[0]?.status, skippedIndex: skipped.nextNodeIndex, suggestion: recovery.errorSuggestion?.includes('Wait'), scheduleType: schedule.type, scheduleDelay: schedule.delayMs, scheduleLabel: formatScheduleLabel(schedule, 'en'), nextRunFuture: nextRun > Date.parse('2026-07-02T08:00:00Z'), fingerprintHasCheckpoint: fingerprint.includes('approval') }));";

  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

function testOrderedNodes(payload) {
  assert(
    JSON.stringify(payload.ordered) ===
      JSON.stringify(["t1", "a1", "ap1", "o1"]),
    `unexpected node order: ${payload.ordered.join(",")}`,
  );
  console.log("PASS: buildOrderedNodeIds respects edges");
}

function testRetries(payload) {
  assert(payload.maxRetries === 1, "getNodeMaxRetries should read node config");
  console.log("PASS: per-node max retries");
}

function testApprovalResume(payload) {
  assert(payload.approvedIndex === 3, "approve advances nextNodeIndex");
  assert(payload.approvedLog === "completed", "approve logs completed");
  assert(payload.rejectedLog === "failed", "reject logs failed");
  console.log("PASS: approval resume actions");
}

function testRecoveryResume(payload) {
  assert(payload.skippedIndex === 3, "skip advances nextNodeIndex");
  assert(payload.suggestion === true, "suggestion mentions waiting for rate limit");
  console.log("PASS: error recovery skip + suggestions");
}

function testScheduler(payload) {
  assert(payload.scheduleType === "delay", "parseTriggerSchedule reads delay");
  assert(payload.scheduleDelay === 3000, "delay capped at config value");
  assert(payload.scheduleLabel.includes("Delay"), "formatScheduleLabel for delay");
  assert(payload.nextRunFuture === true, "computeNextRunAt daily rolls forward");
  console.log("PASS: trigger schedule helpers");
}

function testCheckpointPersistence(payload) {
  assert(payload.fingerprintHasCheckpoint === true, "fingerprint includes checkpoint");
  console.log("PASS: executionCheckpoint in persist fingerprint");
}

const payload = loadModule();
testOrderedNodes(payload);
testRetries(payload);
testApprovalResume(payload);
testRecoveryResume(payload);
testScheduler(payload);
testCheckpointPersistence(payload);

console.log("\nAll workflow execution control tests passed.");