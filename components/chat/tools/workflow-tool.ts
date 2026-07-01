import type { Tool } from "@/components/chat/tools/types";

import { useWorkflow } from "./use-workflow";
import { WORKFLOW_QUOTA_DEFAULTS } from "./workflow-quota";

/**
 * Registry entry for the Workflow modular tool.
 * Runtime wiring lives in `use-tool-runtime` + `useToolsCoordinator`.
 */
export const workflowTool: Tool = {
  id: "workflow",
  label: "Workflow",
  name: "Workflow",
  iconName: "GitBranch",
  description: "Rancang dan jalankan otomatisasi workflow visual",
  enabled: true,
  enabledByDefault: false,
  panelComponent: "WorkflowPanel",
  useHook: useWorkflow,
  quota: WORKFLOW_QUOTA_DEFAULTS,
};