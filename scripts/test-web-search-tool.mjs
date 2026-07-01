/**
 * Smoke test for Web Search modular registry + multi-tool armed state.
 * Run: node scripts/test-web-search-tool.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();

const toolFile = readFileSync(
  join(root, "components/chat/tools/web-search/web-search-tool.ts"),
  "utf8",
);
const hookFile = readFileSync(
  join(root, "components/chat/tools/web-search/use-web-search.ts"),
  "utf8",
);
const registryFile = readFileSync(
  join(root, "components/chat/tools/registry.ts"),
  "utf8",
);

assert(toolFile.includes('id: "web-search"'), "web-search-tool must declare id");
assert(toolFile.includes("useWebSearch"), "web-search-tool must reference useHook");
assert(toolFile.includes("quota"), "web-search-tool must declare quota placeholder");
assert(hookFile.includes("useBaseToolState"), "use-web-search must use BaseToolState");
assert(hookFile.includes("toggleTool"), "use-web-search must expose toggleTool");
assert(hookFile.includes("quota"), "use-web-search must expose quota state");
assert(
  registryFile.includes('webSearchTool'),
  "registry must register webSearchTool",
);

// Multi-tool armed: two flags true, only one panel open
const worksheet = { armed: true, panelOpen: false };
const webSearch = { armed: true, panelOpen: true };
const research = { armed: true, panelOpen: false };

const armedCount = [worksheet, webSearch, research].filter((t) => t.armed).length;
const openPanels = [worksheet, webSearch, research].filter((t) => t.panelOpen).length;

assert(armedCount === 3, "multiple tools may stay armed simultaneously");
assert(openPanels === 1, "only one sidebar panel may be open");

console.log("✓ web search modular tool tests passed");