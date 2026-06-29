"use client";

import { useMemo } from "react";

import { useMap } from "@/components/chat/tools/map/use-map";
import { useResearch } from "@/components/chat/tools/research/use-research";
import {
  buildToolRuntime,
  type ToolRuntimeBundle,
  type ToolRuntimeEntry,
} from "@/components/chat/tools/tool-coordinator-config";
import { useWebSearch } from "@/components/chat/tools/web-search/use-web-search";
import { useWorksheet } from "@/components/chat/tools/worksheet/use-worksheet";

export function useToolRuntime(): {
  bundle: ToolRuntimeBundle;
  entries: ToolRuntimeEntry[];
} {
  const worksheet = useWorksheet();
  const webSearch = useWebSearch();
  const research = useResearch();
  const map = useMap();

  const bundle = useMemo(
    (): ToolRuntimeBundle => ({
      worksheet,
      webSearch,
      research,
      map,
    }),
    [map, research, webSearch, worksheet],
  );

  const entries = useMemo(() => buildToolRuntime(bundle), [bundle]);

  return { bundle, entries };
}