"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import {
  createWorkflowToolStub,
  createWorksheetToolStub,
} from "@/components/chat/tools/heavy-tool-stubs";
import type { HeavyToolSlice } from "@/components/chat/tools/heavy-tool-bridge";
import { useMap } from "@/components/chat/tools/map/use-map";
import { useResearch } from "@/components/chat/tools/research/use-research";
import {
  buildToolRuntime,
  type ToolRuntimeBundle,
  type ToolRuntimeEntry,
} from "@/components/chat/tools/tool-coordinator-config";
import { useWebSearch } from "@/components/chat/tools/web-search/use-web-search";

const HeavyToolBridge = dynamic(
  () =>
    import("@/components/chat/tools/heavy-tool-bridge").then(
      (mod) => mod.HeavyToolBridge,
    ),
  { ssr: false },
);

export function useToolRuntime(options?: { enableHeavyTools?: boolean }) {
  const enableHeavyTools = options?.enableHeavyTools ?? true;
  const webSearch = useWebSearch();
  const research = useResearch();
  const map = useMap();

  const [heavySlice, setHeavySlice] = useState<HeavyToolSlice>(() => ({
    worksheet: createWorksheetToolStub(),
    workflow: createWorkflowToolStub(),
  }));

  const onHeavyReady = useCallback((slice: HeavyToolSlice) => {
    setHeavySlice(slice);
  }, []);

  const bundle = useMemo(
    (): ToolRuntimeBundle => ({
      worksheet: heavySlice.worksheet,
      workflow: heavySlice.workflow,
      webSearch,
      research,
      map,
    }),
    [heavySlice, map, research, webSearch],
  );

  const entries = useMemo(() => buildToolRuntime(bundle), [bundle]);

  const heavyToolBridge = enableHeavyTools ? (
    <HeavyToolBridge onReady={onHeavyReady} />
  ) : null;

  return { bundle, entries, heavyToolBridge };
}