import type { Tool } from "@/components/chat/tools/types";

import { useWorksheet } from "./use-worksheet";
import { WORKSHEET_QUOTA_DEFAULTS } from "./worksheet-quota";

/**
 * Registry entry for the Worksheet modular tool.
 * Runtime wiring lives in `use-tool-runtime` + `useToolsCoordinator`.
 */
export const worksheetTool: Tool = {
  id: "worksheet",
  label: "Worksheet",
  name: "Worksheet",
  iconName: "FileText",
  description: "Buat dan kelola dokumen profesional",
  enabled: true,
  enabledByDefault: false,
  panelComponent: "WorksheetPanel",
  useHook: useWorksheet,
  quota: WORKSHEET_QUOTA_DEFAULTS,
};