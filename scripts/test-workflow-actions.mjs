#!/usr/bin/env node

/**
 * Workflow node action resolution tests.
 */

function resolveWorkflowActionTemplates(template, context) {
  return template
    .replace(/\{\{context\}\}/gi, context.workflowContext)
    .replace(/\{\{prompt\}\}/gi, context.prompt)
    .replace(/\{\{label\}\}/gi, context.label)
    .trim();
}

function resolveWorkflowNodeAction(node, workflowContext) {
  const actionId =
    typeof node.data.config?.action === "string"
      ? node.data.config.action
      : "llm";
  const rawParams = node.data.config?.actionParams ?? {};
  const prompt = node.data.prompt ?? node.data.label;

  const params = {};
  if (actionId === "web_search") {
    params.query = resolveWorkflowActionTemplates(rawParams.query ?? "", {
      workflowContext,
      prompt,
      label: node.data.label,
    });
    if (!params.query) params.query = prompt;
  }

  return { id: actionId, params };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const node = {
  data: {
    label: "Search BPJS",
    prompt: "latest BPJS 2026",
    config: {
      action: "web_search",
      actionParams: { query: "{{prompt}}" },
    },
  },
};

const resolved = resolveWorkflowNodeAction(node, "Workflow context");
assert(resolved.id === "web_search", "action id parsed");
assert(resolved.params.query === "latest BPJS 2026", "template params resolved");
console.log("PASS: workflow action resolution");

console.log("\nAll workflow action tests passed.");