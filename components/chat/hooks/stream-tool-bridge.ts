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

function syncWorksheetErrorDetail(
  deps: StreamToolBridgeDeps,
  message: string | null,
): void {
  if (message) {
    if (deps.tools.worksheet.setErrorDetail) {
      deps.tools.worksheet.setErrorDetail(message);
    } else {
      deps.setWorksheetErrorDetail(message);
    }
  } else if (deps.tools.worksheet.clearErrorDetail) {
    deps.tools.worksheet.clearErrorDetail();
  } else {
    deps.setWorksheetErrorDetail(null);
  }

  // Mirror into persistence hook until it becomes persist-only.
  deps.setWorksheetErrorDetail(message);
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
      deps.tools.worksheet.regenerateDocumentFromStream({
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
      syncWorksheetErrorDetail(deps, null);
      deps.tools.activateWorksheet();
      toast.success(deps.worksheetCreatedLabel);
    }

    deps.persistCurrentChat({
      worksheet: persisted,
      activeRightPanel: deps.tools.worksheet.panelId,
      worksheetToolEnabled: true,
    });
  };

  const resolveWorksheetStreamError = (
    code: WorksheetErrorCode,
    message?: string | null,
  ) => {
    let next =
      deps.tools.worksheet.applyStreamError?.(code, message) ?? null;

    if (!next) {
      next = syncWorkspaceLegacyFields({
        ...setWorksheetWorkspaceError(
          deps.worksheetWorkspaceRef.current,
          code,
          deps.locale,
        ),
        updatedAt: Date.now(),
      });
      deps.tools.worksheet.syncWorkspaceFromExternal(next);
      syncWorksheetErrorDetail(deps, message ?? null);
    }

    return syncWorkspaceLegacyFields({
      ...next,
      updatedAt: Date.now(),
    });
  };

  const onWorksheetError = (errorCode: string) => {
    const code = errorCode as WorksheetErrorCode;
    const persisted = resolveWorksheetStreamError(code, null);

    if (ctx.isActiveChat()) {
      deps.setWorksheetWorkspace(persisted);
      syncWorksheetErrorDetail(deps, null);
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
    }

    if (flags.useWorksheet) {
      const persisted = resolveWorksheetStreamError(
        "generate_failed",
        errorMessage,
      );

      if (ctx.isActiveChat()) {
        deps.setWorksheetWorkspace(persisted);
        syncWorksheetErrorDetail(deps, errorMessage);
        deps.tools.activateWorksheet();
      }

      deps.persistCurrentChat({
        worksheet: persisted,
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