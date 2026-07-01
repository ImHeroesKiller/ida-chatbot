#!/usr/bin/env node

/**
 * Tests for workflow chat discovery/edit phase resolution and discovery parse behavior.
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
    'import { buildWorkflowChatContext, resolveWorkflowChatPhase } from "./lib/workflow-chat-context.ts"; ' +
    'import { parseWorkflowFromResponse, buildWorkflowPromptSection } from "./lib/workflow-chat.ts"; ' +
    'import { createEmptyWorkflowWorkspace, createWorkflowDefinition } from "./lib/workflow.ts"; ' +
    "const empty = createEmptyWorkflowWorkspace(); " +
    "const withPending = { ...empty, chatDiscoveryPending: true }; " +
    "const withWorkflow = (() => { const ws = createWorkflowDefinition(empty, { name: 'Test' }); return ws; })(); " +
    "const discoveryPhase = resolveWorkflowChatPhase({ workspace: empty }); " +
    "const generatePhase = resolveWorkflowChatPhase({ workspace: withPending }); " +
    "const editPhase = resolveWorkflowChatPhase({ workspace: withWorkflow }); " +
    "const discoveryPrompt = buildWorkflowPromptSection('en', buildWorkflowChatContext({ workspace: empty })); " +
    "const editPrompt = buildWorkflowPromptSection('en', buildWorkflowChatContext({ workspace: withWorkflow, activeWorkflow: withWorkflow.workflows[0] })); " +
    "const discoveryParse = parseWorkflowFromResponse('Please confirm trigger and actions.', 'en', { phase: 'discovery' }); " +
    "console.log(JSON.stringify({ discoveryPhase, generatePhase, editPhase, discoveryIsDiscoverySection: discoveryPrompt.includes('Discovery Phase'), discoveryNoJsonSchema: !discoveryPrompt.includes('\"nodes\": ['), editHasGraph: editPrompt.includes('\"nodes\"'), discoveryNoError: !discoveryParse.error, discoveryNoWorkflow: !discoveryParse.workflow }));";

  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

const payload = loadModule();

assert(payload.discoveryPhase === "discovery", "empty workspace → discovery");
assert(payload.generatePhase === "generate", "pending flag → generate");
assert(payload.editPhase === "edit", "existing workflow → edit");
assert(payload.discoveryIsDiscoverySection === true, "discovery prompt is discovery section");
assert(payload.discoveryNoJsonSchema === true, "discovery prompt has no JSON schema block");
assert(payload.editHasGraph === true, "edit prompt includes active graph");
assert(payload.discoveryNoError === true, "discovery parse should not error");
assert(payload.discoveryNoWorkflow === true, "discovery parse has no workflow");

console.log("PASS: workflow chat phase resolution");
console.log("PASS: discovery vs edit prompt sections");
console.log("PASS: discovery parse tolerates missing JSON");
console.log("\nAll workflow chat context tests passed.");