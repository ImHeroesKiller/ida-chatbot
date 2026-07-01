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

const routing = runSnippet(
  'import { resolveAgentForWorkflowNode } from "./lib/agent/multi-agent/types.ts"; ' +
    "const node = (kind, action) => ({ id: 'n', type: 'workflow', position: { x: 0, y: 0 }, data: { label: 'Step', kind, config: { action } } }); " +
    "console.log(JSON.stringify({ " +
    "webSearch: resolveAgentForWorkflowNode(node('action', 'web_search'), { id: 'web_search', runtime: 'server', params: { query: 'x' } }), " +
    "worksheet: resolveAgentForWorkflowNode(node('action', 'worksheet_update'), { id: 'worksheet_update', runtime: 'client', params: {} }), " +
    "approval: resolveAgentForWorkflowNode(node('approval', 'llm'), { id: 'llm', runtime: 'llm', params: {} }), " +
    "output: resolveAgentForWorkflowNode(node('output', 'llm'), { id: 'llm', runtime: 'llm', params: {} }), " +
    "condition: resolveAgentForWorkflowNode(node('condition', 'llm'), { id: 'llm', runtime: 'llm', params: {} }) " +
    "}));",
);

assert(routing.webSearch === "researcher", "web_search routes to researcher");
assert(routing.worksheet === "executor", "worksheet_update routes to executor");
assert(routing.approval === "approver", "approval routes to approver");
assert(routing.output === "documenter", "output routes to documenter");
assert(routing.condition === "analyst", "condition routes to analyst");

console.log("PASS: supervisor routing maps workflow nodes to specialist agents");

const graph = runSnippet(
  'import { MULTI_AGENT_GRAPH_NODES } from "./lib/agent/multi-agent/graph.ts"; ' +
    "console.log(JSON.stringify({ nodes: MULTI_AGENT_GRAPH_NODES }));",
);

assert(graph.nodes.includes("supervisor"), "graph includes supervisor");
assert(graph.nodes.includes("researcher"), "graph includes researcher");
assert(graph.nodes.includes("documenter"), "graph includes documenter");
assert(graph.nodes.length === 6, "graph has 6 nodes");

console.log("PASS: LangGraph multi-agent node registry");

console.log("\nAll multi-agent tests passed.");