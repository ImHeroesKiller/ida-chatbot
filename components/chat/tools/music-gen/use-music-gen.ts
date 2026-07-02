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

export interface MusicGenTool extends BaseToolState, BaseToolLifecycle {
  prompt: string;
  setPrompt: (v: string) => void;
  isGenerating: boolean;
  generate: () => Promise<void>;
  lastAudioUrl: string | null;
}

const PANEL_ID = TOOL_PANEL_IDS["music-gen"];

export function useMusicGen(): MusicGenTool {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const { setEnabled, toggleTool, openPanel, closePanel } = createBaseToolActions({
    setIsEnabled,
    setIsPanelOpen,
  });

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    // STUB: would return real audio url from backend model
    setLastAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    setIsGenerating(false);
  }, [prompt]);

  const hydrate = useCallback((state: ToolHydrationInput) => {
    applyBaseHydration(state, { setIsEnabled, setIsPanelOpen });
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState({ setIsEnabled, setIsPanelOpen });
    setPrompt("");
    setLastAudioUrl(null);
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
    lastAudioUrl,
    hydrate,
    resetForNewChat,
  };
}
