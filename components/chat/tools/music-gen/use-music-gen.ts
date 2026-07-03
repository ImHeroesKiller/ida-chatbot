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

export interface MusicGenResult {
  id: string;
  prompt: string;
  audioUrl: string;
  durationSec?: number;
}

export interface MusicGenTool extends BaseToolState, BaseToolLifecycle {
  prompt: string;
  setPrompt: (v: string) => void;
  isGenerating: boolean;
  generate: () => Promise<MusicGenResult | null>;
  lastResult: MusicGenResult | null;
  lastAudioUrl: string | null;
}

const PANEL_ID = TOOL_PANEL_IDS["music-gen"];

export function useMusicGen(): MusicGenTool {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<MusicGenResult | null>(null);

  const { setEnabled, toggleTool, openPanel, closePanel } = createBaseToolActions({
    setIsEnabled,
    setIsPanelOpen,
  });

  const generate = useCallback(async (): Promise<MusicGenResult | null> => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) return null;

    setIsGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const result: MusicGenResult = {
        id: `music-${Date.now()}`,
        prompt: finalPrompt,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        durationSec: 180,
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
    lastAudioUrl: lastResult?.audioUrl ?? null,
    hydrate,
    resetForNewChat,
  };
}