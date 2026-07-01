import type { Tool } from "@/components/chat/tools/types";

import { WEB_SEARCH_QUOTA_DEFAULTS } from "./web-search-quota";
import { useWebSearch } from "./use-web-search";

/**
 * Registry entry for the Web Search modular tool.
 * Runtime wiring lives in `use-tool-runtime` + `useToolsCoordinator`.
 */
export const webSearchTool: Tool = {
  id: "web-search",
  label: "Web Search",
  name: "Web Search",
  iconName: "Globe",
  description: "Cari informasi terkini dari internet",
  enabled: true,
  enabledByDefault: true,
  panelComponent: "WebSearchPanel",
  useHook: useWebSearch,
  quota: WEB_SEARCH_QUOTA_DEFAULTS,
};