#!/usr/bin/env node

/**
 * Unit tests for workflow execution log merging (SSE progress snapshots).
 */

function pushOrUpdateLog(logs, entry) {
  if (entry.status !== "running") {
    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const current = logs[index];
      if (current.nodeId === entry.nodeId && current.status === "running") {
        const next = [...logs];
        next[index] = entry;
        return next;
      }
    }
  }

  return [...logs, entry];
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function testRunningToCompleted() {
  const logs = pushOrUpdateLog([], {
    nodeId: "n1",
    label: "Action",
    kind: "action",
    status: "running",
    startedAt: 1,
  });

  const merged = pushOrUpdateLog(logs, {
    nodeId: "n1",
    label: "Action",
    kind: "action",
    status: "completed",
    startedAt: 1,
    completedAt: 2,
    output: "done",
  });

  assert(merged.length === 1, "running entry upgrades to completed");
  assert(merged[0].status === "completed", "final status is completed");
  console.log("PASS: running → completed log merge");
}

function testFailedUpgrade() {
  const logs = pushOrUpdateLog([], {
    nodeId: "n2",
    label: "Output",
    kind: "output",
    status: "running",
    startedAt: 3,
  });

  const merged = pushOrUpdateLog(logs, {
    nodeId: "n2",
    label: "Output",
    kind: "output",
    status: "failed",
    startedAt: 3,
    completedAt: 4,
    message: "boom",
  });

  assert(merged.length === 1, "single node entry after failure");
  assert(merged[0].status === "failed", "failed status preserved");
  console.log("PASS: running → failed log merge");
}

testRunningToCompleted();
testFailedUpgrade();

console.log("\nAll workflow execute stream tests passed.");