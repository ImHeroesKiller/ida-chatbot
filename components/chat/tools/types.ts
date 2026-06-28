import type { ReactNode } from "react";

export type ToolId = "worksheet" | "web-search" | "map" | "research";

export interface Tool {
  id: ToolId;
  label: string;
  icon?: ReactNode;
  enabled?: boolean;
}

export interface ToolState {
  enabled: boolean;
  activePanel?: boolean;
}