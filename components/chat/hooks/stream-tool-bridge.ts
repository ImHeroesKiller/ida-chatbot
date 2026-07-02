import type { Dispatch, RefObject, SetStateAction } from "react";
import toast from "react-hot-toast";

import { extractResearchTopicFromMessages } from "@/components/chat/tools/use-tools-coordinator";
import type { StreamToolCoordinator } from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import type { IdaSseDonePayload, IdaSseMetaPayload } from "@/lib/sse";
import {
  getWorkflowStreamErrorMessage,
  type WorkflowStreamPayload,
} from "@/lib/workflow-chat";
import { COPY } from "@/lib/i18n";
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
  useWorkflow: boolean;
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
  desktopSidebar: boolean;
  heavyToolsDesktop: boolean;
  tools: StreamToolCoordinator;
  persistCurrentChat: (patch: Partial<ChatSession>) => void;
  setMessages: Dispatch<SetStateAction<IdaMessage[]>>;
  setWorksheetWorkspace: Dispatch<SetStateAction<WorksheetDocument>>;
  setWorksheetErrorDetail: Dispatch<SetStateAction<string | null>>;
  worksheetWorkspaceRef: RefObject<WorksheetDocument>;
  lastWorksheetPromptRef: RefObject<string>;
  worksheetCreatedLabel: string;
  workflowCreatedLabel: string;
  workflowEditedLabel: string;
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

function mirrorWorksheetToPersistLayer(
  deps: StreamToolBridgeDeps,
  workspace: WorksheetDocument,
): void {
  if (deps.tools.worksheet.syncToPersistLayer) {
    deps.tools.worksheet.syncToPersistLayer(workspace);
    return;
  }

  deps.setWorksheetWorkspace(workspace);
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

  // Legacy mirror — runtime SSOT is `tools.worksheet.errorDetail`.
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
      if (deps.desktopSidebar) {
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
      if (deps.tools.worksheet.hydrateFromExternal) {
        deps.tools.worksheet.hydrateFromExternal(next);
      } else {
        deps.tools.worksheet.syncWorkspaceFromExternal(next);
      }
    }

    const persisted = syncWorkspaceLegacyFields({
      ...next,
      updatedAt: Date.now(),
    });

    patchStreamMessage(messageState, streamId, {
      worksheetResult: {
        title: worksheet.title,
        summary: promptSummary || worksheet.content.slice(0, 160),
        documentId: persisted.activeDocumentId ?? undefined,
      },
    });

    if (ctx.isActiveChat()) {
      mirrorWorksheetToPersistLayer(deps, next);
      syncWorksheetErrorDetail(deps, null);
      if (deps.heavyToolsDesktop) {
        deps.tools.activateWorksheet();
      }
      deps.setMessages(messageState.messages);
      toast.success(deps.worksheetCreatedLabel);
    }

    deps.persistCurrentChat({
      worksheet: persisted,
      ...(deps.heavyToolsDesktop
        ? {
            activeRightPanel: deps.tools.worksheet.panelId,
            worksheetToolEnabled: true,
          }
        : {}),
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
      if (deps.tools.worksheet.hydrateFromExternal) {
        deps.tools.worksheet.hydrateFromExternal(next);
      } else {
        deps.tools.worksheet.syncWorkspaceFromExternal(next);
      }
      syncWorksheetErrorDetail(deps, message ?? null);
    }

    return syncWorkspaceLegacyFields({
      ...next,
      updatedAt: Date.now(),
    });
  };

  const persistWorkflowWorkspace = (
    nextWorkspace: ReturnType<typeof deps.tools.workflow.getWorkspace>,
    options?: { errorMessage?: string | null },
  ) => {
    if (ctx.isActiveChat()) {
      deps.tools.workflow.syncToPersistLayer(nextWorkspace);
      if (deps.heavyToolsDesktop) {
        deps.tools.workflow.setEnabled(true);
        deps.tools.openPanel(deps.tools.workflow.panelId);
      }

      if (options?.errorMessage) {
        deps.tools.workflow.setErrorDetail(options.errorMessage);
      }
    }

    deps.persistCurrentChat({
      workflow: nextWorkspace,
      ...(deps.heavyToolsDesktop
        ? {
            activeRightPanel: deps.tools.workflow.panelId,
            workflowToolEnabled: true,
          }
        : {}),
    });
  };

  const onWorkflowDone = (
    workflow: WorkflowStreamPayload,
    options?: { mode?: "created" | "edited" },
  ) => {
    console.info("[workflow:bridge] onWorkflowDone", {
      name: workflow.name,
      nodeCount: workflow.nodes?.length ?? 0,
      edgeCount: workflow.edges?.length ?? 0,
    });

    const hadWorkflowBefore =
      deps.tools.workflow.getWorkspace().workflows.length > 0;
    const imported = deps.tools.workflow.importWorkflowFromStream(workflow);
    const nextWorkspace = deps.tools.workflow.getWorkspace();

    if (!imported) {
      console.warn("[workflow:bridge] importWorkflowFromStream returned null", {
        payloadNodeCount: workflow.nodes?.length ?? 0,
        workspaceWorkflowCount: nextWorkspace.workflows.length,
        activeWorkflowId: nextWorkspace.activeWorkflowId,
      });

      const errorMessage = getWorkflowStreamErrorMessage(
        "parse_failed",
        deps.locale,
      );
      const errored =
        deps.tools.workflow.applyStreamError?.("parse_failed", errorMessage) ??
        nextWorkspace;

      persistWorkflowWorkspace(errored, { errorMessage });

      if (ctx.isActiveChat()) {
        toast.error(errorMessage);
      }
      return;
    }

    const verifiedWorkspace = deps.tools.workflow.getWorkspace();
    if (
      !verifiedWorkspace.activeWorkflowId ||
      verifiedWorkspace.workflows.length === 0
    ) {
      console.error("[workflow:bridge] import reported success but workspace empty", {
        importedId: imported.id,
        activeWorkflowId: verifiedWorkspace.activeWorkflowId,
        workflowCount: verifiedWorkspace.workflows.length,
      });
    }

    const mode =
      options?.mode ?? (hadWorkflowBefore ? "edited" : "created");

    patchStreamMessage(messageState, streamId, {
      workflowResult: {
        workflowId: imported.id,
        name: workflow.name,
        description: workflow.description,
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
        mode,
        status: "ready",
      },
    });

    if (ctx.isActiveChat()) {
      deps.tools.workflow.clearErrorDetail();
      if (deps.heavyToolsDesktop) {
        deps.tools.workflow.setEnabled(true);
        deps.tools.openPanel(deps.tools.workflow.panelId);
      }
      deps.setMessages(messageState.messages);
      toast.success(
        mode === "edited"
          ? deps.workflowEditedLabel
          : deps.workflowCreatedLabel,
      );
    } else {
      deps.persistCurrentChat({ messages: messageState.messages });
    }

    deps.persistCurrentChat({
      workflow: verifiedWorkspace,
      ...(deps.heavyToolsDesktop
        ? {
            activeRightPanel: deps.tools.workflow.panelId,
            workflowToolEnabled: true,
          }
        : {}),
    });
  };

  const onWorkflowDiscovery = (workflowName?: string) => {
    deps.tools.workflow.setChatDiscoveryPending?.(true);

    patchStreamMessage(messageState, streamId, {
      workflowResult: {
        workflowId: "discovery",
        name: workflowName?.trim() || COPY[deps.locale].workflowResultDiscovery,
        nodeCount: 0,
        edgeCount: 0,
        mode: "created",
        status: "discovery",
      },
    });

    if (ctx.isActiveChat()) {
      deps.setMessages(messageState.messages);
    } else {
      deps.persistCurrentChat({ messages: messageState.messages });
    }
  };

  const onWorkflowError = (errorCode: string) => {
    const code = errorCode as import("@/lib/workflow").WorkflowErrorCode;
    const errorMessage = getWorkflowStreamErrorMessage(code, deps.locale);
    const nextWorkspace =
      deps.tools.workflow.applyStreamError?.(code, errorMessage) ??
      deps.tools.workflow.getWorkspace();

    persistWorkflowWorkspace(nextWorkspace, { errorMessage });

    if (ctx.isActiveChat()) {
      toast.error(errorMessage);
    }
  };

  const onWorksheetError = (errorCode: string) => {
    const code = errorCode as WorksheetErrorCode;
    const persisted = resolveWorksheetStreamError(code, null);

    if (ctx.isActiveChat() && deps.heavyToolsDesktop) {
      mirrorWorksheetToPersistLayer(deps, persisted);
      syncWorksheetErrorDetail(deps, null);
      deps.tools.activateWorksheet();
    }

    deps.persistCurrentChat({
      worksheet: persisted,
      ...(deps.heavyToolsDesktop
        ? {
            activeRightPanel: deps.tools.worksheet.panelId,
            worksheetToolEnabled: true,
          }
        : {}),
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

      if (ctx.isActiveChat() && deps.heavyToolsDesktop) {
        mirrorWorksheetToPersistLayer(deps, persisted);
        syncWorksheetErrorDetail(deps, errorMessage);
        deps.tools.activateWorksheet();
      }

      deps.persistCurrentChat({
        worksheet: persisted,
        ...(deps.heavyToolsDesktop
          ? {
              activeRightPanel: deps.tools.worksheet.panelId,
              worksheetToolEnabled: true,
            }
          : {}),
      });
    }

    if (flags.useWebSearch && ctx.isActiveChat()) {
      deps.tools.webSearch.finishSearchError(errorMessage);
      if (deps.desktopSidebar) {
        deps.tools.openPanel(deps.tools.webSearch.panelId);
      }
    }

    if (flags.useResearch && ctx.isActiveChat()) {
      deps.tools.research.endChatResearch();
      if (deps.desktopSidebar) {
        deps.tools.openPanel(deps.tools.research.panelId);
      }
    }

    if (flags.useWorkflow) {
      const persisted =
        deps.tools.workflow.applyStreamError?.("parse_failed", errorMessage) ??
        deps.tools.workflow.getWorkspace();

      if (ctx.isActiveChat()) {
        deps.tools.workflow.syncToPersistLayer(persisted);
        deps.tools.workflow.setErrorDetail(errorMessage);
        if (deps.heavyToolsDesktop) {
          deps.tools.workflow.setEnabled(true);
          deps.tools.openPanel(deps.tools.workflow.panelId);
        }
      }

      deps.persistCurrentChat({
        workflow: persisted,
        ...(deps.heavyToolsDesktop
          ? {
              activeRightPanel: deps.tools.workflow.panelId,
              workflowToolEnabled: true,
            }
          : {}),
      });
    }
  };

  return {
    onWebSearchMeta,
    onResearchMeta,
    onWorksheetDone,
    onWorkflowDone,
    onWorkflowDiscovery,
    onWorksheetError,
    onWorkflowError,
    onStreamError,
  };
}