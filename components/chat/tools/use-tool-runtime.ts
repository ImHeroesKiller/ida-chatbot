"use client";

import { useMemo } from "react";

import { useMap } from "@/components/chat/tools/map/use-map";
import { useMusicGen } from "@/components/chat/tools/music-gen/use-music-gen";
import { useResearch } from "@/components/chat/tools/research/use-research";
import {
  buildToolRuntime,
  type ToolRuntimeBundle,
  type ToolRuntimeEntry,
} from "@/components/chat/tools/tool-coordinator-config";
import { useVideoGen } from "@/components/chat/tools/video-gen/use-video-gen";
import { useWebSearch } from "@/components/chat/tools/web-search/use-web-search";
import { useWorkflow } from "@/components/chat/tools/use-workflow";
import { useWorksheet } from "@/components/chat/tools/worksheet/use-worksheet";
import { useImageGen } from "@/components/chat/tools/image-gen/use-image-gen";

export function useToolRuntime(): {
  bundle: ToolRuntimeBundle;
  entries: ToolRuntimeEntry[];
} {
  const worksheet = useWorksheet();
  const workflow = useWorkflow();
  const webSearch = useWebSearch();
  const research = useResearch();
  const map = useMap();
  const imageGen = useImageGen();
  const videoGen = useVideoGen();
  const musicGen = useMusicGen();

  const bundle = useMemo(
    (): ToolRuntimeBundle => ({
      worksheet,
      workflow,
      webSearch,
      research,
      map,
      imageGen,
      videoGen,
      musicGen,
    }),
    [map, research, webSearch, workflow, worksheet, imageGen, videoGen, musicGen],
  );

  const entries = useMemo(() => buildToolRuntime(bundle), [bundle]);

  return { bundle, entries };
}