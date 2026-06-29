"use client";

import { useMemo } from "react";

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
      worksheet: worksheet.worksheetWorkspace,
      worksheetErrorDetail: worksheet.worksheetErrorDetail,
      worksheetGenerating: isLoading && tools.worksheet.isEnabled,
      worksheetCanRegenerate: Boolean(worksheet.lastWorksheetPrompt.trim()),
      onWorksheetChange: worksheet.handleWorksheetChange,
      onWorksheetApplyTemplate: worksheet.handleWorksheetApplyTemplate,
      onWorksheetRetry: handleWorksheetRetry,
      onWorksheetRegenerate: handleWorksheetRetry,
      onWorksheetClear: worksheet.handleWorksheetClear,
    }),
    [
      handleWorksheetRetry,
      isLoading,
      locale,
      toolPanelCoreProps,
      tools.worksheet.isEnabled,
      worksheet.handleWorksheetApplyTemplate,
      worksheet.handleWorksheetChange,
      worksheet.handleWorksheetClear,
      worksheet.lastWorksheetPrompt,
      worksheet.worksheetErrorDetail,
      worksheet.worksheetWorkspace,
    ],
  );

  return { sharedToolPanelProps };
}