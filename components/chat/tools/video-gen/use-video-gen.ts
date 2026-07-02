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

export interface VideoGenTool extends BaseToolState, BaseToolLifecycle {
  prompt: string;
  setPrompt: (v: string) => void;
  isGenerating: boolean;
  generate: () => Promise<void>;
  lastResultUrl: string | null;
}

const PANEL_ID = TOOL_PANEL_IDS["video-gen"];

export function useVideoGen(): VideoGenTool {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResultUrl, setLastResultUrl] = useState<string | null>(null);

  const { setEnabled, toggleTool, openPanel, closePanel } = createBaseToolActions({
    setIsEnabled,
    setIsPanelOpen,
  });

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // STUB implementation
    await new Promise((r) => setTimeout(r, 1200));
    setLastResultUrl("https://picsum.photos/seed/video-demo/640/360"); // placeholder video thumb
    setIsGenerating(false);
  }, [prompt]);

  const hydrate = useCallback((state: ToolHydrationInput) => {
    applyBaseHydration(state, { setIsEnabled, setIsPanelOpen });
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState({ setIsEnabled, setIsPanelOpen });
    setPrompt("");
    setLastResultUrl(null);
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
    lastResultUrl,
    hydrate,
    resetForNewChat,
  };
}
