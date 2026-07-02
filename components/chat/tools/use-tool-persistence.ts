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
  desktopSidebar: boolean;
}

export function useToolPersistence({
  entries,
  activePanel,
  heavyToolsDesktop,
  desktopSidebar,
}: UseToolPersistenceOptions) {
  const hydrateFromChat = useCallback(
    (chat: ChatSession) => {
      const panel = desktopSidebar ? (chat.activeRightPanel ?? null) : null;
      for (const entry of entries) {
        hydrateToolFromChat(entry, chat, panel, {
          heavyToolsDesktop,
          desktopSidebar,
        });
      }
    },
    [desktopSidebar, entries, heavyToolsDesktop],
  );

  const resetForNewChat = useCallback(() => {
    for (const entry of entries) {
      entry.tool.resetForNewChat();
    }
  }, [entries]);

  const getPersistPatch = useCallback(() => {
    const patch: Partial<ChatSession> = {
      activeRightPanel: desktopSidebar ? activePanel : null,
    };

    for (const entry of entries) {
      Object.assign(patch, getToolPersistFields(entry));
    }

    return patch;
  }, [activePanel, desktopSidebar, entries]);

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