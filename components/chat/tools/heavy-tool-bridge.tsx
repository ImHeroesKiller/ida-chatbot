"use client";

import { useEffect } from "react";

import type { ToolRuntimeBundle } from "@/components/chat/tools/tool-coordinator-config";
import { useWorkflow } from "@/components/chat/tools/use-workflow";
import { useWorksheet } from "@/components/chat/tools/worksheet/use-worksheet";

export type HeavyToolSlice = Pick<ToolRuntimeBundle, "worksheet" | "workflow">;

interface HeavyToolBridgeProps {
  onReady: (slice: HeavyToolSlice) => void;
}

/** Loads worksheet/workflow hooks in a separate chunk after first paint. */
export function HeavyToolBridge({ onReady }: HeavyToolBridgeProps) {
  const worksheet = useWorksheet();
  const workflow = useWorkflow();

  useEffect(() => {
    onReady({ worksheet, workflow });
  }, [onReady, worksheet, workflow]);

  return null;
}