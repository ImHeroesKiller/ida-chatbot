import type { Tool } from "@/components/chat/tools/types";

import { MAP_QUOTA_DEFAULTS } from "./map-quota";
import { useMap } from "./use-map";

/**
 * Registry entry for the Map modular tool.
 * Runtime wiring lives in `use-tool-runtime` + `useToolsCoordinator`.
 */
export const mapTool: Tool = {
  id: "map",
  label: "Map",
  name: "Map",
  iconName: "Map",
  description: "Integrasi peta dan analisis lokasi",
  enabled: true,
  enabledByDefault: false,
  panelComponent: "MapPanel",
  useHook: useMap,
  quota: MAP_QUOTA_DEFAULTS,
};