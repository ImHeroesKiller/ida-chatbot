"use client";

import { useCallback, useLayoutEffect, useMemo } from "react";

import { syncWorkspaceLegacyFields } from "@/lib/worksheet-workspace";

import { useChatToolHandlers } from "@/components/chat/hooks/use-chat-tool-handlers";
import type { useWorksheetWorkspace } from "@/components/chat/hooks/use-worksheet-workspace";
import type { ToolPanelHostProps } from "@/components/chat/tools/tool-panel-host";
import type { ToolPanelHandlerCoordinator } from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";

type WorksheetWorkspace = ReturnType<typeof useWorksheetWorkspace>;

export type SharedToolPanelProps = Omit<
  ToolPanelHostProps,
  "panel" | "embedded" | "className"
>;

interface UseChatToolPanelPropsOptions {
  locale: Locale;
  tools: ToolPanelHandlerCoordinator;
  isLoading: boolean;
  worksheet: WorksheetWorkspace;
  setInput: (value: string | ((prev: string) => string)) => void;
  persistCurrentChat: (
    patch: Partial<
      Pick<
        ChatSession,
        | "worksheet"
        | "worksheetToolEnabled"
        | "activeRightPanel"
        | "researchSessions"
      >
    >,
  ) => void;
  sendMessage: (text: string) => Promise<void>;
  copy: {
    researchSessionSaved: string;
    worksheetCreated: string;
  };
}

export function useChatToolPanelProps({
  locale,
  tools,
  isLoading,
  worksheet,
  setInput,
  persistCurrentChat,
  sendMessage,
  copy,
}: UseChatToolPanelPropsOptions) {
  const worksheetGeneratingFromStream =
    isLoading && tools.worksheet.isEnabled;

  useLayoutEffect(() => {
    tools.worksheet.setGenerating(worksheetGeneratingFromStream);
  }, [tools.worksheet.setGenerating, worksheetGeneratingFromStream]);

  const worksheetGenerating =
    tools.worksheet.isGenerating || worksheetGeneratingFromStream;

  const handleWorksheetChange = useCallback(
    (workspace: (typeof tools.worksheet)["workspace"]) => {
      if (tools.worksheet.hydrateFromExternal) {
        tools.worksheet.hydrateFromExternal(workspace);
      } else {
        tools.worksheet.syncWorkspaceFromExternal(workspace);
      }
      worksheet.setWorksheetWorkspaceInbound(workspace);
    },
    [
      tools.worksheet.hydrateFromExternal,
      tools.worksheet.syncWorkspaceFromExternal,
      worksheet.setWorksheetWorkspaceInbound,
    ],
  );

  const handleWorksheetApplyTemplate = useCallback(
    (template: Parameters<typeof worksheet.handleWorksheetApplyTemplate>[0]) => {
      if (tools.worksheet.applyTemplate) {
        tools.worksheet.applyTemplate(template);
        return;
      }
      worksheet.handleWorksheetApplyTemplate(template);
    },
    [tools.worksheet, worksheet],
  );

  const handleWorksheetClear = useCallback(() => {
    if (tools.worksheet.clearAllDocuments) {
      tools.worksheet.clearAllDocuments();
      worksheet.setLastWorksheetPrompt("");
      return;
    }
    worksheet.handleWorksheetClear();
  }, [tools.worksheet, worksheet]);

  const {
    handleWorksheetRetry,
    sharedToolPanelProps: toolPanelCoreProps,
  } = useChatToolHandlers({
    locale,
    tools,
    isLoading,
    lastWorksheetPrompt: worksheet.lastWorksheetPrompt,
    worksheetWorkspaceRef: worksheet.worksheetWorkspaceRef,
    setWorksheetWorkspace: worksheet.setWorksheetWorkspace,
    setInput,
    persistCurrentChat,
    sendMessage,
    copy,
  });

  const sharedToolPanelProps = useMemo(
    (): SharedToolPanelProps => ({
      locale,
      ...toolPanelCoreProps,
      worksheet: syncWorkspaceLegacyFields(tools.worksheet.workspace),
      worksheetTool: tools.worksheet,
      worksheetErrorDetail: tools.worksheet.errorDetail,
      worksheetGenerating,
      worksheetCanRegenerate: Boolean(worksheet.lastWorksheetPrompt.trim()),
      onWorksheetChange: handleWorksheetChange,
      onWorksheetApplyTemplate: handleWorksheetApplyTemplate,
      onWorksheetRetry: handleWorksheetRetry,
      onWorksheetRegenerate: handleWorksheetRetry,
      onWorksheetClear: handleWorksheetClear,
    }),
    [
      handleWorksheetChange,
      handleWorksheetRetry,
      locale,
      toolPanelCoreProps,
      tools.worksheet,
      handleWorksheetApplyTemplate,
      handleWorksheetClear,
      worksheet.lastWorksheetPrompt,
      worksheetGenerating,
    ],
  );

  return { sharedToolPanelProps };
}