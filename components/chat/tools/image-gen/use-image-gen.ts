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

export interface ImageGenResult {
  id: string;
  prompt: string;
  imageUrl: string;
  model: string;
  createdAt: string;
  aspectRatio?: string;
}

export interface ImageGenTool extends BaseToolState, BaseToolLifecycle {
  prompt: string;
  setPrompt: (prompt: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  isGenerating: boolean;
  lastResult: ImageGenResult | null;
  history: ImageGenResult[];
  generate: (customPrompt?: string) => Promise<void>;
  clearLastResult: () => void;
  useResultAsAttachment: (result: ImageGenResult) => void; // for future chat integration
}

const PANEL_ID = TOOL_PANEL_IDS["image-gen"];

/**
 * Hook for Image Generation tool.
 * Uses Grok Imagine (or configured model from Admin > Media Models) as default.
 * Initial implementation: client-side stub that produces a deterministic placeholder image.
 * TODO: Wire to real /api/image-gen (Grok Imagine / fal / xai image endpoint).
 */
export function useImageGen(): ImageGenTool {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<ImageGenResult | null>(null);
  const [history, setHistory] = useState<ImageGenResult[]>([]);

  const { setEnabled, toggleTool, openPanel, closePanel } = createBaseToolActions({
    setIsEnabled,
    setIsPanelOpen,
    onDisable: () => {
      // optional cleanup
    },
  });

  const generate = useCallback(async (customPrompt?: string) => {
    const finalPrompt = (customPrompt ?? prompt).trim();
    if (!finalPrompt) return;

    setIsGenerating(true);

    try {
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
          model: "grok-imagine", // TODO: resolveToolModel from admin config
        }),
      });

      if (!res.ok) throw new Error("Image generation request failed");

      const data = await res.json();

      const result: ImageGenResult = {
        id: data.id || `img-${Date.now()}`,
        prompt: data.prompt || finalPrompt,
        imageUrl: data.imageUrl,
        model: data.model || "grok-imagine",
        createdAt: data.createdAt || new Date().toISOString(),
        aspectRatio: data.aspectRatio || aspectRatio,
      };

      setLastResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 10));
    } catch (err) {
      console.error("[image-gen] generate failed", err);
      // Fallback to placeholder on error
      const seed = finalPrompt.split("").reduce((a, c) => (a + c.charCodeAt(0)) % 100000, 0);
      const dims = aspectRatio === "16:9" ? "768/432" : aspectRatio === "9:16" ? "512/912" : "512/512";
      const fallbackUrl = `https://picsum.photos/seed/${seed}/${dims}`;
      const result: ImageGenResult = {
        id: `img-${Date.now()}`,
        prompt: finalPrompt,
        imageUrl: fallbackUrl,
        model: "grok-imagine (fallback)",
        createdAt: new Date().toISOString(),
        aspectRatio,
      };
      setLastResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 10));
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, aspectRatio]);

  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);

  const useResultAsAttachment = useCallback((result: ImageGenResult) => {
    // Placeholder: in future, this can emit an attachment or set in composer via context.
    // For now log + could call a global event.
    console.log("[image-gen] use as attachment", result);
    // Example future: requestChatComposerFocus or dispatch attachment
  }, []);

  const hydrate = useCallback((state: ToolHydrationInput) => {
    applyBaseHydration(state, { setIsEnabled, setIsPanelOpen });
    // No special persist for prompt/results yet (ephemeral per chat or extend ChatSession)
  }, []);

  const resetForNewChat = useCallback(() => {
    resetBaseToolState({ setIsEnabled, setIsPanelOpen });
    setPrompt("");
    setLastResult(null);
    setHistory([]);
    setIsGenerating(false);
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
    aspectRatio,
    setAspectRatio,
    isGenerating,
    lastResult,
    history,
    generate,
    clearLastResult,
    useResultAsAttachment,
    hydrate,
    resetForNewChat,
  };
}
