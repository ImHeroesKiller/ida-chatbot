import type { ReactNode } from "react";

export type ToolId =
  | "worksheet"
  | "workflow"
  | "web-search"
  | "map"
  | "research";

export type ToolQuotaResetPeriod = "daily" | "weekly" | "monthly";

/** Registry-level quota config (placeholder until account management ships). */
export interface ToolQuotaConfig {
  enabled: boolean;
  limit: number;
  resetPeriod: ToolQuotaResetPeriod;
}

/** Runtime quota counters tracked inside a tool hook. */
export interface ToolQuotaState extends ToolQuotaConfig {
  used: number;
}

export type ToolHookFactory = () => unknown;

export interface Tool {
  id: ToolId;
  /** @deprecated Prefer `name` on modular tool definitions. */
  label: string;
  name?: string;
  icon?: ReactNode;
  /** Lucide icon name for registry-driven UIs. */
  iconName?: string;
  description?: string;
  enabled?: boolean;
  enabledByDefault?: boolean;
  panelComponent?: string;
  useHook?: ToolHookFactory;
  quota?: ToolQuotaConfig;
}

/** @deprecated Use BaseToolState from base-tool-state.ts */
export interface ToolState {
  enabled: boolean;
  activePanel?: boolean;
}