import type { Tool } from "@/components/chat/tools/types";

import { RESEARCH_QUOTA_DEFAULTS } from "./research-quota";
import { useResearch } from "./use-research";

/**
 * Registry entry for the Research modular tool.
 * Runtime wiring lives in `use-tool-runtime` + `useToolsCoordinator`.
 */
export const researchTool: Tool = {
  id: "research",
  label: "Research",
  name: "Research",
  iconName: "Search",
  description: "Lakukan riset mendalam dengan multi-level depth",
  enabled: true,
  enabledByDefault: false,
  panelComponent: "ResearchPanel",
  useHook: useResearch,
  quota: RESEARCH_QUOTA_DEFAULTS,
};