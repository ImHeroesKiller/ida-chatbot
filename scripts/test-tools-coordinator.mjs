/**
 * Smoke test for tool panel mutual exclusion (coordinator-helpers logic).
 * Run: node scripts/test-tools-coordinator.mjs
 */

function createMockTool(panelId) {
  let open = false;
  return {
    panelId,
    get isPanelOpen() {
      return open;
    },
    openPanel() {
      open = true;
    },
    closePanel() {
      open = false;
    },
  };
}

function resolveActivePanel(tools) {
  return tools.find((tool) => tool.isPanelOpen)?.panelId ?? null;
}

function closeAllPanelControllers(tools) {
  for (const tool of tools) {
    tool.closePanel();
  }
}

function openExclusivePanel(tools, panel) {
  closeAllPanelControllers(tools);
  const target = tools.find((tool) => tool.panelId === panel);
  target?.openPanel();
}

function togglePanel(tools, activePanel, panel) {
  if (activePanel === panel) {
    closeAllPanelControllers(tools);
    return;
  }
  openExclusivePanel(tools, panel);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const worksheet = createMockTool("worksheet");
const webSearch = createMockTool("web-search");
const research = createMockTool("research");
const map = createMockTool("map");
const tools = [worksheet, webSearch, research, map];

// Open worksheet exclusively
openExclusivePanel(tools, "worksheet");
assert(resolveActivePanel(tools) === "worksheet", "worksheet should be active");
assert(!webSearch.isPanelOpen, "web-search must be closed");
assert(!research.isPanelOpen, "research must be closed");

// Switch to web-search
openExclusivePanel(tools, "web-search");
assert(resolveActivePanel(tools) === "web-search", "web-search should be active");
assert(!worksheet.isPanelOpen, "worksheet must close when switching");

// Toggle active panel off
togglePanel(tools, "web-search", "web-search");
assert(resolveActivePanel(tools) === null, "toggle should close active panel");

// Open map then research — only one survives
openExclusivePanel(tools, "map");
openExclusivePanel(tools, "research");
assert(resolveActivePanel(tools) === "research", "research wins exclusive open");
assert(!map.isPanelOpen, "map must close when research opens");

// closeAllPanels
openExclusivePanel(tools, "worksheet");
closeAllPanelControllers(tools);
assert(resolveActivePanel(tools) === null, "closeAllPanels clears every panel");

console.log("✓ tools coordinator mutual exclusion tests passed");