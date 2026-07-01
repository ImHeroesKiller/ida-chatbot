import type { Dispatch, RefObject, SetStateAction } from "react";
import toast from "react-hot-toast";

import { extractResearchTopicFromMessages } from "@/components/chat/tools/use-tools-coordinator";
import type { StreamToolCoordinator } from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import type { IdaSseDonePayload, IdaSseMetaPayload } from "@/lib/sse";
import type { IdaMessage } from "@/lib/types";
import {
  type WorksheetDocument,
  type WorksheetErrorCode,
} from "@/lib/worksheet";
import {
  addGeneratedWorksheetDocument,
  setWorksheetWorkspaceError,
  summarizeWorksheetPrompt,
  syncWorkspaceLegacyFields,
} from "@/lib/worksheet-workspace";

export interface StreamSendFlags {
  useWebSearch: boolean;
  useResearch: boolean;
  useWorksheet: boolean;
}

export interface StreamToolContext {
  chatIdAtSend: string;
  streamId: string;
  contextMessages: IdaMessage[];
  researchTopic?: string;
  isActiveChat: () => boolean;
}

export interface StreamMessageState {
  messages: IdaMessage[];
}

export interface StreamToolBridgeDeps {
  locale: Locale;
  isMobileViewport: boolean;
  tools: StreamToolCoordinator;
  persistCurrentChat: (patch: Partial<ChatSession>) => void;
  setMessages: Dispatch<SetStateAction<IdaMessage[]>>;
  setWorksheetWorkspace: Dispatch<SetStateAction<WorksheetDocument>>;
  setWorksheetErrorDetail: Dispatch<SetStateAction<string | null>>;
  worksheetWorkspaceRef: RefObject<WorksheetDocument>;
  lastWorksheetPromptRef: RefObject<string>;
  worksheetCreatedLabel: string;
}

function patchStreamMessage(
  messageState: StreamMessageState,
  streamId: string,
  patch: Partial<IdaMessage>,
): void {
  messageState.messages = messageState.messages.map((message) =>
    message.id === streamId ? { ...message, ...patch } : message,
  );
}

export function syncStreamMessages(
  messageState: StreamMessageState,
  deps: Pick<StreamToolBridgeDeps, "setMessages" | "persistCurrentChat">,
  isActiveChat: boolean,
): void {
  if (isActiveChat) {
    deps.setMessages(messageState.messages);
  } else {
    deps.persistCurrentChat({ messages: messageState.messages });
  }
}

export function createStreamToolBridge(
  deps: StreamToolBridgeDeps,
  ctx: StreamToolContext,
  messageState: StreamMessageState,
) {
  const { streamId, contextMessages, researchTopic } = ctx;

  const onWebSearchMeta = (
    sources: IdaSseMetaPayload["webSearchSources"],
    queries?: string[],
  ) => {
    if (!sources?.length) return;

    patchStreamMessage(messageState, streamId, { webSearchSources: sources });

    if (ctx.isActiveChat()) {
      deps.setMessages(messageState.messages);
      deps.tools.webSearch.setSearchResults(sources);
      if (queries?.length) {
        deps.tools.webSearch.setLastQuery(queries[queries.length - 1] ?? null);
      }
      deps.tools.webSearch.setEnabled(true);
      if (!deps.isMobileViewport) {
        deps.tools.openPanel(deps.tools.webSearch.panelId);
      }
    } else {
      deps.persistCurrentChat({
        messages: messageState.messages,
        webSearchEnabled: true,
        activeRightPanel: deps.tools.webSearch.panelId,
      });
    }
  };

  const onResearchMeta = (
    sources: IdaSseMetaPayload["researchSources"],
    queries?: string[],
    summary?: string,
  ) => {
    if (!sources?.length && !summary?.trim()) return;

    patchStreamMessage(messageState, streamId, {
      researchSources: sources,
      researchQueries: queries,
      researchSummary: summary,
    });

    const topic =
      researchTopic?.trim() ||
      extractResearchTopicFromMessages(contextMessages);

    if (ctx.isActiveChat()) {
      deps.setMessages(messageState.messages);
      deps.tools.research.applyResearchFromMessage({
        topic,
        summary: summary ?? "",
        sources: sources ?? [],
        queries: queries ?? [],
      });
      deps.tools.activateResearch();
    } else {
      deps.persistCurrentChat({
        messages: messageState.messages,
        researchEnabled: true,
        activeRightPanel: deps.tools.research.panelId,
      });
    }
  };

  const onWorksheetDone = (
    worksheet: NonNullable<IdaSseDonePayload["worksheet"]>,
  ) => {
    const promptSummary = summarizeWorksheetPrompt(
      deps.lastWorksheetPromptRef.current,
    );

    // Primary path: runtime workspace lives on the tool hook.
    let next =
      deps.tools.worksheet.createDocumentFromStream({
        title: worksheet.title,
        content: worksheet.content,
        promptSummary,
        activate: false,
      }) ?? null;

    // Fallback: legacy workspace ref path if stream payload is invalid.
    if (!next) {
      const legacyNext = addGeneratedWorksheetDocument(
        deps.worksheetWorkspaceRef.current,
        {
          title: worksheet.title,
          content: worksheet.content,
          promptSummary,
        },
        { activate: false },
      );
      next = syncWorkspaceLegacyFields({
        ...legacyNext,
        updatedAt: Date.now(),
      });
      deps.tools.worksheet.syncWorkspaceFromExternal(next);
    }

    const persisted = syncWorkspaceLegacyFields({
      ...next,
      updatedAt: Date.now(),
    });

    if (ctx.isActiveChat()) {
      // Keep persistence hook aligned until it becomes persist-only.
      deps.setWorksheetWorkspace(next);
      deps.setWorksheetErrorDetail(null);
      deps.tools.activateWorksheet();
      toast.success(deps.worksheetCreatedLabel);
    }

    deps.persistCurrentChat({
      worksheet: persisted,
      activeRightPanel: deps.tools.worksheet.panelId,
      worksheetToolEnabled: true,
    });
  };

  const onWorksheetError = (errorCode: string) => {
    const code = errorCode as WorksheetErrorCode;
    const next = setWorksheetWorkspaceError(
      deps.worksheetWorkspaceRef.current,
      code,
      deps.locale,
    );
    const persisted = syncWorkspaceLegacyFields({
      ...next,
      updatedAt: Date.now(),
    });

    if (ctx.isActiveChat()) {
      deps.setWorksheetWorkspace(next);
      deps.setWorksheetErrorDetail(null);
      deps.tools.activateWorksheet();
    }

    deps.persistCurrentChat({
      worksheet: persisted,
      activeRightPanel: deps.tools.worksheet.panelId,
      worksheetToolEnabled: true,
    });
  };

  const onStreamError = (errorMessage: string, flags: StreamSendFlags) => {
    if (ctx.isActiveChat()) {
      deps.setMessages((prev) =>
        prev.filter((message) => message.id !== streamId),
      );

      if (flags.useWorksheet) {
        const next = setWorksheetWorkspaceError(
          deps.worksheetWorkspaceRef.current,
          "generate_failed",
          deps.locale,
        );
        deps.setWorksheetWorkspace(next);
        deps.setWorksheetErrorDetail(errorMessage);
        deps.tools.activateWorksheet();
      }
    }

    if (flags.useWorksheet) {
      const next = setWorksheetWorkspaceError(
        deps.worksheetWorkspaceRef.current,
        "generate_failed",
        deps.locale,
      );
      deps.persistCurrentChat({
        worksheet: syncWorkspaceLegacyFields({
          ...next,
          updatedAt: Date.now(),
        }),
        activeRightPanel: deps.tools.worksheet.panelId,
        worksheetToolEnabled: true,
      });
    }

    if (flags.useWebSearch && ctx.isActiveChat()) {
      deps.tools.webSearch.finishSearchError(errorMessage);
      if (!deps.isMobileViewport) {
        deps.tools.openPanel(deps.tools.webSearch.panelId);
      }
    }

    if (flags.useResearch && ctx.isActiveChat()) {
      deps.tools.research.endChatResearch();
      deps.tools.openPanel(deps.tools.research.panelId);
    }
  };

  return {
    onWebSearchMeta,
    onResearchMeta,
    onWorksheetDone,
    onWorksheetError,
    onStreamError,
  };
}