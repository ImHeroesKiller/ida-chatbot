#!/usr/bin/env node

/**
 * Workflow template library tests (built-in catalog, apply modes, JSON I/O).
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
    'import { BUILTIN_WORKFLOW_TEMPLATES, createDemoWorkflowWorkspace, getBuiltinWorkflowTemplates, parseWorkflowImportJson, resolveWorkflowTemplate, searchWorkflowTemplates, serializeWorkflowForExport } from "./lib/workflow-templates.ts"; ' +
    'import { applyWorkflowTemplateToWorkspace, createEmptyWorkflowWorkspace, getWorkflowById } from "./lib/workflow.ts"; ' +
    "console.log(JSON.stringify({ builtinCount: BUILTIN_WORKFLOW_TEMPLATES.length, templateIds: BUILTIN_WORKFLOW_TEMPLATES.map((t) => t.id), demoNodes: createDemoWorkflowWorkspace().workflows[0]?.nodes.length ?? 0, resolved: resolveWorkflowTemplate(BUILTIN_WORKFLOW_TEMPLATES[0], 'en').nodes.length, search: searchWorkflowTemplates(getBuiltinWorkflowTemplates(), 'en', 'onboarding').length, replace: applyWorkflowTemplateToWorkspace(createEmptyWorkflowWorkspace(), { name: 'Test', nodes: BUILTIN_WORKFLOW_TEMPLATES[0].definition.nodes, edges: BUILTIN_WORKFLOW_TEMPLATES[0].definition.edges }, { mode: 'replace' }).workflows.length, append: applyWorkflowTemplateToWorkspace(createEmptyWorkflowWorkspace(), { name: 'Append', nodes: BUILTIN_WORKFLOW_TEMPLATES[1].definition.nodes, edges: BUILTIN_WORKFLOW_TEMPLATES[1].definition.edges }, { mode: 'append' }).workflows.length, staleReplace: (() => { const resolved = resolveWorkflowTemplate(BUILTIN_WORKFLOW_TEMPLATES[2], 'id'); const ws = { ...createEmptyWorkflowWorkspace(), activeWorkflowId: 'ghost-id', workflows: [] }; const next = applyWorkflowTemplateToWorkspace(ws, { name: resolved.name, nodes: resolved.nodes, edges: resolved.edges }, { mode: 'replace' }); const wf = next.activeWorkflowId ? getWorkflowById(next, next.activeWorkflowId) : null; return Boolean(wf && wf.nodes.length > 0); })(), autoFix: (() => { const parsed = parseWorkflowImportJson(JSON.stringify({ name: 'Broken', nodes: [{ data: { label: 'A' } }, { data: { label: 'B', kind: 'output' } }] })); return parsed?.nodes.length === 2 && parsed.edges.length === 1; })(), exportRoundTrip: (() => { const wf = createDemoWorkflowWorkspace().workflows[0]; const json = serializeWorkflowForExport(wf); const parsed = parseWorkflowImportJson(json); return parsed?.nodes.length === wf.nodes.length; })() }));";
  const output = execSync(`npx --yes tsx -e ${JSON.stringify(snippet)}`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output.trim());
}

function testNoDebtTemplates(payload) {
  const forbidden = ["debt", "loan", "collector"];
  const hits = payload.templateIds.filter((id) =>
    forbidden.some((word) => id.includes(word)),
  );
  assert(hits.length === 0, `forbidden debt/loan templates found: ${hits.join(", ")}`);
  console.log("PASS: no debt/loan/collector templates");
}

function testBuiltinCatalog(payload) {
  assert(payload.builtinCount === 12, `expected 12 built-in templates, got ${payload.builtinCount}`);
  assert(payload.resolved > 0, "template locale resolution failed");
  assert(payload.search >= 1, "template search failed");
  console.log("PASS: built-in template catalog");
}

function testApplyModes(payload) {
  assert(payload.replace === 1, "replace mode should create one workflow");
  assert(payload.append === 1, "append mode should create one workflow");
  assert(payload.demoNodes >= 4, "demo workspace should include template nodes");
  console.log("PASS: apply replace/append modes");
}

function testJsonRoundTrip(payload) {
  assert(payload.exportRoundTrip === true, "export/import JSON round-trip failed");
  console.log("PASS: JSON export/import round-trip");
}

function testStaleActiveIdReplace(payload) {
  assert(payload.staleReplace === true, "replace with stale activeWorkflowId should still apply");
  console.log("PASS: stale activeWorkflowId replace fallback");
}

function testAutoFixImport(payload) {
  assert(payload.autoFix === true, "import auto-fix for missing id/position/edges failed");
  console.log("PASS: import auto-fix common graph issues");
}

const payload = loadModule();
testNoDebtTemplates(payload);
testBuiltinCatalog(payload);
testApplyModes(payload);
testJsonRoundTrip(payload);
testStaleActiveIdReplace(payload);
testAutoFixImport(payload);

console.log("\nAll workflow template tests passed.");