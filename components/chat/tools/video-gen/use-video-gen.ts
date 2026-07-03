"use client";

import { useCallback, useState } from "react";

import {
  applyBaseHydration,
  createBaseToolActions,
  resetBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";

export interface VideoGenResult {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  aspectRatio?: string;
}

export interface VideoGenTool extends BaseToolState, BaseToolLifecycle {
  prompt: string;
  setPrompt: (v: string) => void;
  isGenerating: boolean;
  generate: () => Promise<VideoGenResult | null>;
  lastResult: VideoGenResult | null;
  lastResultUrl: string | null;
}

const PANEL_ID = TOOL_PANEL_IDS["video-gen"];

export function useVideoGen(): VideoGenTool {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<VideoGenResult | null>(null);

  const { setEnabled, toggleTool, openPanel, closePanel } = createBaseToolActions({
    setIsEnabled,
    setIsPanelOpen,
  });

  const generate = useCallback(async (): Promise<VideoGenResult | null> => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) return null;

    setIsGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const result: VideoGenResult = {
        id: `video-${Date.now()}`,
        prompt: finalPrompt,
        thumbnailUrl: "https://picsum.photos/seed/video-demo/640/360",
        aspectRatio: "16:9",
      };
      setLastResult(result);
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  const hydrate = useCallback((state: ToolHydrationInput) => {
    applyBaseHydration(state, { setIsEnabled, setIsPanelOpen });
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState({ setIsEnabled, setIsPanelOpen });
    setPrompt("");
    setLastResult(null);
  }, []);

  return {
    panelId: PANEL_ID,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    prompt,
    setPrompt,
    isGenerating,
    generate,
    lastResult,
    lastResultUrl: lastResult?.thumbnailUrl ?? null,
    hydrate,
    resetForNewChat,
  };
}