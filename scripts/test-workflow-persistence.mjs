#!/usr/bin/env node

/**
 * Workflow workspace persistence round-trip (client store shape ↔ Supabase row).
 */

function createEmptyWorkflowWorkspace() {
  const now = Date.now();
  return {
    workflows: [],
    activeWorkflowId: null,
    updatedAt: now,
    lastExecution: null,
  };
}

function normalizeWorkflowWorkspace(workspace) {
  if (!workspace) return createEmptyWorkflowWorkspace();

  const workflows = (workspace.workflows ?? []).map((wf) => ({
    ...wf,
    nodes: (wf.nodes ?? []).map((node) => ({
      ...node,
      data: { ...node.data },
      position: { ...node.position },
    })),
    edges: (wf.edges ?? []).map((edge) => ({ ...edge })),
  }));

  const activeWorkflowId =
    workspace.activeWorkflowId &&
    workflows.some((wf) => wf.id === workspace.activeWorkflowId)
      ? workspace.activeWorkflowId
      : (workflows[0]?.id ?? null);

  return {
    workflows,
    activeWorkflowId,
    updatedAt: workspace.updatedAt ?? Date.now(),
    lastExecution: workspace.lastExecution ?? null,
    error: workspace.error,
  };
}

function rowToChatSessionWorkflowFields(row) {
  const panel = row.active_right_panel;
  return {
    workflowToolEnabled:
      row.workflow_tool_enabled ?? panel === "workflow",
    workflow: normalizeWorkflowWorkspace(row.workflow),
  };
}

function chatSessionToRowWorkflowFields(chat) {
  return {
    workflow: chat.workflow ?? null,
    workflow_tool_enabled: Boolean(chat.workflowToolEnabled),
  };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function testNullWorkflowMigration() {
  const fields = rowToChatSessionWorkflowFields({
    workflow: null,
    workflow_tool_enabled: null,
    active_right_panel: null,
  });

  assert(fields.workflow.workflows.length === 0, "null workflow → empty workspace");
  assert(fields.workflowToolEnabled === false, "null flag → disabled");
  console.log("PASS: existing sessions with null workflow migrate cleanly");
}

function testWorkflowRoundTrip() {
  const sampleWorkflow = {
    workflows: [
      {
        id: "workflow-1",
        name: "Onboarding",
        nodes: [
          {
            id: "node-1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { label: "Start", kind: "trigger" },
          },
        ],
        edges: [],
        createdAt: 1,
        updatedAt: 2,
      },
    ],
    activeWorkflowId: "workflow-1",
    updatedAt: 3,
    lastExecution: null,
  };

  const chat = {
    workflowToolEnabled: true,
    workflow: sampleWorkflow,
    activeRightPanel: "workflow",
  };

  const row = chatSessionToRowWorkflowFields(chat);
  assert(row.workflow_tool_enabled === true, "enabled flag saved");
  assert(row.workflow.workflows.length === 1, "workflow body saved");

  const restored = rowToChatSessionWorkflowFields({
    workflow: row.workflow,
    workflow_tool_enabled: row.workflow_tool_enabled,
    active_right_panel: "workflow",
  });

  assert(
    restored.workflow.workflows[0].name === "Onboarding",
    "workflow name round-trips",
  );
  assert(
    restored.workflow.activeWorkflowId === "workflow-1",
    "active workflow id round-trips",
  );
  assert(restored.workflowToolEnabled === true, "enabled flag round-trips");
  console.log("PASS: workflow workspace round-trip through session row");
}

function testPanelFallbackForLegacyRows() {
  const fields = rowToChatSessionWorkflowFields({
    workflow: null,
    workflow_tool_enabled: null,
    active_right_panel: "workflow",
  });

  assert(fields.workflowToolEnabled === true, "legacy panel fallback enables workflow");
  console.log("PASS: legacy rows infer workflowToolEnabled from active panel");
}

testNullWorkflowMigration();
testWorkflowRoundTrip();
testPanelFallbackForLegacyRows();

console.log("\nAll workflow persistence tests passed.");