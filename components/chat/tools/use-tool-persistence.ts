"use client";

import { useCallback } from "react";

import { isToolAvailable } from "@/components/chat/tools/coordinator-helpers";
import {
  getToolPersistFields,
  hydrateToolFromChat,
  type ToolRuntimeEntry,
} from "@/components/chat/tools/tool-coordinator-config";
import type { ChatSession } from "@/lib/chat-store";
import type { RightSidebarPanel } from "@/lib/chat-tools";

interface UseToolPersistenceOptions {
  entries: ToolRuntimeEntry[];
  activePanel: RightSidebarPanel | null;
  heavyToolsDesktop: boolean;
}

export function useToolPersistence({
  entries,
  activePanel,
  heavyToolsDesktop,
}: UseToolPersistenceOptions) {
  const hydrateFromChat = useCallback(
    (chat: ChatSession) => {
      const panel = chat.activeRightPanel ?? null;
      for (const entry of entries) {
        hydrateToolFromChat(entry, chat, panel, { heavyToolsDesktop });
      }
    },
    [entries, heavyToolsDesktop],
  );

  const resetForNewChat = useCallback(() => {
    for (const entry of entries) {
      entry.tool.resetForNewChat();
    }
  }, [entries]);

  const getPersistPatch = useCallback(() => {
    const patch: Partial<ChatSession> = {
      activeRightPanel: activePanel,
    };

    for (const entry of entries) {
      Object.assign(patch, getToolPersistFields(entry));
    }

    return patch;
  }, [activePanel, entries]);

  return {
    hydrateFromChat,
    resetForNewChat,
    getPersistPatch,
    isWorksheetAvailable: isToolAvailable("worksheet"),
    isWebSearchAvailable: isToolAvailable("web-search"),
    isResearchAvailable: isToolAvailable("research"),
    isMapAvailable: isToolAvailable("map"),
    isWorkflowAvailable: isToolAvailable("workflow"),
  };
}