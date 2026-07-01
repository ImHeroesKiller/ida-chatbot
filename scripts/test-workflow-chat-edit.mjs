#!/usr/bin/env node

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runSnippet(snippet) {
  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

function testWorksheetUpdateMerge() {
  const snippet =
    'import { mergeWorkflowChatEditNode } from "./lib/workflow-chat-edit.ts"; ' +
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
    "console.log(JSON.stringify({ preservedId: merged.id === 'n1', preservedPos: merged.position.x === 40, action: merged.data.config?.action, tool: merged.data.config?.tool, prompt: merged.data.config?.prompt, titleParam: merged.data.config?.actionParams?.title, editedSameId: node?.id === 'n1', editedAction: node?.data.config?.action, editedTool: node?.data.config?.tool, editedPrompt: node?.data.config?.prompt }));";

  const result = runSnippet(snippet);

  assert(result.preservedId === true, "merge keeps stable node id");
  assert(result.preservedPos === true, "merge keeps canvas position");
  assert(result.action === "worksheet_update", "merge updates action tool");
  assert(result.tool === "worksheet_update", "merge syncs config.tool");
  assert(result.prompt === "formal prompt", "merge updates prompt");
  assert(result.titleParam === "Report", "merge updates actionParams");
  assert(result.editedSameId === true, "applyWorkflowChatEdit preserves id");
  assert(result.editedAction === "worksheet_update", "chat edit syncs action");
  assert(result.editedTool === "worksheet_update", "chat edit syncs tool");
  assert(result.editedPrompt === "formal prompt", "chat edit syncs prompt");

  console.log("PASS: worksheet_update merge preserves ids and updates tools");
}

function testWebSearchViaToolFieldOnSecondNode() {
  const snippet =
    'import { mergeWorkflowChatEditGraph } from "./lib/workflow-chat-edit.ts"; ' +
    'import { workflowPayloadToDefinition } from "./lib/workflow-chat.ts"; ' +
    "const existingNodes = [ " +
    "  { id: 'n1', type: 'workflow', position: { x: 10, y: 10 }, data: { label: 'Trigger', kind: 'trigger', config: {} } }, " +
    "  { id: 'n2', type: 'workflow', position: { x: 50, y: 90 }, data: { label: 'Research', kind: 'action', config: { action: 'llm', prompt: 'find info' } } }, " +
    "]; " +
    "const payload = workflowPayloadToDefinition({ name: 'WF', nodes: [ " +
    "  { id: 'tmp-1', label: 'Trigger', kind: 'trigger', position: { x: 120, y: 80 } }, " +
    "  { id: 'tmp-2', label: 'Research', kind: 'action', prompt: 'find info', config: { tool: 'web_search', actionParams: { query: 'BPJS 2026' } }, position: { x: 168, y: 152 } }, " +
    "], edges: [] }); " +
    "const { nodes } = mergeWorkflowChatEditGraph({ existingNodes, incomingNodes: payload.nodes, incomingEdges: [] }); " +
    "const second = nodes[1]; " +
    "console.log(JSON.stringify({ preservedId: second.id === 'n2', action: second.data.config?.action, tool: second.data.config?.tool, query: second.data.config?.actionParams?.query }));";

  const result = runSnippet(snippet);

  assert(result.preservedId === true, "second node keeps stable id via index match");
  assert(result.action === "web_search", "tool field resolves to web_search action");
  assert(result.tool === "web_search", "config.tool synced to web_search");
  assert(result.query === "BPJS 2026", "web_search actionParams preserved");

  console.log("PASS: ganti tool node kedua → web_search via config.tool");
}

function testInterviewLabelWorksheetUpdate() {
  const snippet =
    'import { mergeWorkflowChatEditGraph } from "./lib/workflow-chat-edit.ts"; ' +
    'import { workflowPayloadToDefinition } from "./lib/workflow-chat.ts"; ' +
    "const existingNodes = [ " +
    "  { id: 'a1', type: 'workflow', position: { x: 0, y: 0 }, data: { label: 'Start', kind: 'trigger', config: {} } }, " +
    "  { id: 'a2', type: 'workflow', position: { x: 100, y: 0 }, data: { label: 'interview', kind: 'action', config: { action: 'llm', prompt: 'ask questions', actionParams: { content: 'old' } } } }, " +
    "]; " +
    "const payload = workflowPayloadToDefinition({ name: 'WF', nodes: [ " +
    "  { id: 'a1', label: 'Start', kind: 'trigger', position: { x: 120, y: 80 } }, " +
    "  { id: 'a2', label: 'interview', kind: 'action', action: 'worksheet_update', prompt: 'ask questions', actionParams: { title: 'Interview Notes', content: '{{context}}' }, position: { x: 168, y: 152 } }, " +
    "], edges: [] }); " +
    "const { nodes } = mergeWorkflowChatEditGraph({ existingNodes, incomingNodes: payload.nodes, incomingEdges: [] }); " +
    "const interview = nodes.find((n) => n.data.label === 'interview'); " +
    "console.log(JSON.stringify({ action: interview?.data.config?.action, tool: interview?.data.config?.tool, title: interview?.data.config?.actionParams?.title, staleContent: interview?.data.config?.actionParams?.content }));";

  const result = runSnippet(snippet);

  assert(result.action === "worksheet_update", "interview node action updated");
  assert(result.tool === "worksheet_update", "interview node tool synced");
  assert(result.title === "Interview Notes", "worksheet_update params applied");
  assert(result.staleContent === "{{context}}", "stale llm actionParams replaced on tool change");

  console.log("PASS: ubah action node interview → worksheet_update");
}

testWorksheetUpdateMerge();
testWebSearchViaToolFieldOnSecondNode();
testInterviewLabelWorksheetUpdate();

console.log("\nAll workflow chat edit tests passed.");