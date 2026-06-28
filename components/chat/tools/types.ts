import type { ReactNode } from "react";

export type ToolId = "worksheet" | "web-search" | "map" | "research";

export interface Tool {
  id: ToolId;
  label: string;
  icon?: ReactNode;
  enabled?: boolean;
}

/** @deprecated Use BaseToolState from base-tool-state.ts */
export interface ToolState {
  enabled: boolean;
  activePanel?: boolean;
}