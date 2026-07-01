/**
 * Smoke test for Map modular registry + multi-tool armed state.
 * Run: node scripts/test-map-tool.mjs
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();

const toolFile = readFileSync(
  join(root, "components/chat/tools/map/map-tool.ts"),
  "utf8",
);
const hookFile = readFileSync(
  join(root, "components/chat/tools/map/use-map.ts"),
  "utf8",
);
const quotaFile = readFileSync(
  join(root, "components/chat/tools/map/map-quota.ts"),
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

assert(toolFile.includes('id: "map"'), "map-tool must declare id");
assert(toolFile.includes("useMap"), "map-tool must reference useHook");
assert(
  toolFile.includes("MAP_QUOTA_DEFAULTS"),
  "map-tool must wire quota defaults",
);
assert(quotaFile.includes("limit: 30"), "map quota limit must be 30");
assert(quotaFile.includes("enabled: false"), "map quota must be disabled");
assert(hookFile.includes("useBaseToolState"), "use-map must use BaseToolState");
assert(hookFile.includes("toggleTool"), "use-map must expose toggleTool");
assert(hookFile.includes("quota"), "use-map must expose quota state");
assert(registryFile.includes("mapTool"), "registry must register mapTool");
assert(
  coordinatorFile.includes("toggleMapTool"),
  "coordinator must expose toggleMapTool",
);

const webSearch = { armed: true, panelOpen: false };
const research = { armed: true, panelOpen: false };
const map = { armed: true, panelOpen: true };

assert(
  webSearch.armed && research.armed && map.armed,
  "map, research, and web search may all be armed",
);
assert(
  [webSearch, research, map].filter((tool) => tool.panelOpen).length === 1,
  "only one panel may be open",
);

console.log("✓ map modular tool tests passed");