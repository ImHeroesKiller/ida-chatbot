#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadModule() {
  const snippet =
    'import { mergeWorkflowChatEditGraph, mergeWorkflowChatEditNode } from "./lib/workflow-chat-edit.ts"; ' +
    'import { applyWorkflowChatEdit, createEmptyWorkflowWorkspace, createWorkflowDefinition, getWorkflowById } from "./lib/workflow.ts"; ' +
    'import { workflowPayloadToDefinition } from "./lib/workflow-chat.ts"; ' +
    "const existing = { id: 'n1', type: 'workflow', position: { x: 40, y: 60 }, data: { label: 'WhatsApp', kind: 'action', config: { action: 'llm', prompt: 'old', actionParams: { content: 'draft' } } } }; " +
    "const incoming = { id: 'new-id', type: 'workflow', position: { x: 120, y: 80 }, data: { label: 'WhatsApp', kind: 'action', config: { action: 'worksheet_update', prompt: 'formal prompt', actionParams: { title: 'Report', content: 'body' } } } }; " +
    "const merged = mergeWorkflowChatEditNode(existing, incoming, 0); " +
    "const definition = workflowPayloadToDefinition({ name: 'WF', nodes: [{ id: 'new-id', label: 'WhatsApp', kind: 'action', action: 'worksheet_update', prompt: 'formal prompt', actionParams: { title: 'Report', content: 'body' }, config: { action: 'worksheet_update', prompt: 'formal prompt', actionParams: { title: 'Report', content: 'body' } } }], edges: [] }); " +
    "let ws = createWorkflowDefinition(createEmptyWorkflowWorkspace(), { name: 'WF' }); " +
    "const activeId = ws.activeWorkflowId; " +
    "ws = applyWorkflowChatEdit(ws, { name: 'WF', nodes: [{ ...existing, data: existing.data }], edges: [], activate: true }); " +
    "const edited = applyWorkflowChatEdit(ws, { name: 'WF Updated', nodes: definition.nodes, edges: definition.edges, activate: true }); " +
    "const wf = activeId ? getWorkflowById(edited, activeId) : null; " +
    "const node = wf?.nodes.find((n) => n.data.label === 'WhatsApp'); " +
    "console.log(JSON.stringify({ preservedId: merged.id === 'n1', preservedPos: merged.position.x === 40, action: merged.data.config?.action, prompt: merged.data.config?.prompt, titleParam: merged.data.config?.actionParams?.title, editedSameId: node?.id === 'n1', editedAction: node?.data.config?.action, editedPrompt: node?.data.config?.prompt }));";

  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

const result = loadModule();

assert(result.preservedId === true, "merge keeps stable node id");
assert(result.preservedPos === true, "merge keeps canvas position");
assert(result.action === "worksheet_update", "merge updates action tool");
assert(result.prompt === "formal prompt", "merge updates prompt");
assert(result.titleParam === "Report", "merge updates actionParams");
assert(result.editedSameId === true, "applyWorkflowChatEdit preserves id");
assert(result.editedAction === "worksheet_update", "chat edit syncs action");
assert(result.editedPrompt === "formal prompt", "chat edit syncs prompt");

console.log("PASS: workflow chat edit merge preserves ids and updates tools");
console.log("\nAll workflow chat edit tests passed.");