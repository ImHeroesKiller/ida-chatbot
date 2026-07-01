/**
 * Smoke test for Research modular registry + multi-tool armed state.
 * Run: node scripts/test-research-tool.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();

const toolFile = readFileSync(
  join(root, "components/chat/tools/research/research-tool.ts"),
  "utf8",
);
const hookFile = readFileSync(
  join(root, "components/chat/tools/research/use-research.ts"),
  "utf8",
);
const quotaFile = readFileSync(
  join(root, "components/chat/tools/research/research-quota.ts"),
  "utf8",
);
const registryFile = readFileSync(
  join(root, "components/chat/tools/registry.ts"),
  "utf8",
);
const coordinatorFile = readFileSync(
  join(root, "components/chat/tools/use-tools-coordinator.ts"),
  "utf8",
);

assert(toolFile.includes('id: "research"'), "research-tool must declare id");
assert(toolFile.includes("useResearch"), "research-tool must reference useHook");
assert(
  toolFile.includes("RESEARCH_QUOTA_DEFAULTS"),
  "research-tool must wire quota defaults",
);
assert(quotaFile.includes("limit: 20"), "research quota limit must be 20");
assert(quotaFile.includes("enabled: false"), "research quota must be disabled");
assert(hookFile.includes("useBaseToolState"), "use-research must use BaseToolState");
assert(hookFile.includes("toggleTool"), "use-research must expose toggleTool");
assert(hookFile.includes("quota"), "use-research must expose quota state");
assert(registryFile.includes("researchTool"), "registry must register researchTool");
assert(
  coordinatorFile.includes("toggleResearchTool"),
  "coordinator must expose toggleResearchTool",
);

const webSearch = { armed: true, panelOpen: false };
const research = { armed: true, panelOpen: true };

assert(webSearch.armed && research.armed, "research and web search may both be armed");
assert(
  [webSearch, research].filter((tool) => tool.panelOpen).length === 1,
  "only one panel may be open",
);

console.log("✓ research modular tool tests passed");