"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { ChatSessionRefs } from "@/components/chat/hooks/use-chat-session-refs";
import {
  createStreamToolBridge,
  syncStreamMessages,
  type StreamMessageState,
  type StreamSendFlags,
  type StreamToolBridgeDeps,
} from "@/components/chat/hooks/stream-tool-bridge";
import type { StreamToolCoordinator } from "@/components/chat/tools/coordinator-types";
import { buildChatApiRequestBody } from "@/lib/client/chat-api-payload";
import { consumeIdaSseStream } from "@/lib/client/parse-sse";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import type { IdaSseMetaPayload } from "@/lib/sse";
import type { IdaHandoffPrefill, IdaMessage } from "@/lib/types";
import type { WorksheetDocument } from "@/lib/worksheet";

interface UseChatStreamOptions {
  locale: Locale;
  copy: {
    errors: {
      rateLimit: string;
      generic: string;
    };
    worksheetCreated: string;
  };
  tools: StreamToolCoordinator;
  sessionRefs: ChatSessionRefs;
  persistCurrentChat: (patch: Partial<ChatSession>) => void;
  setMessages: Dispatch<SetStateAction<IdaMessage[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  worksheetWorkspaceRef: RefObject<WorksheetDocument>;
  setWorksheetWorkspace: Dispatch<SetStateAction<WorksheetDocument>>;
  setWorksheetErrorDetail: Dispatch<SetStateAction<string | null>>;
  lastWorksheetPromptRef: RefObject<string>;
  openHandoff: (prefill: IdaHandoffPrefill) => void;
  autoSpeakEnabled: boolean;
  speak: (messageId: string, content: string) => void;
}

export function useChatStream({
  locale,
  copy,
  tools,
  sessionRefs,
  persistCurrentChat,
  setMessages,
  setError,
  worksheetWorkspaceRef,
  setWorksheetWorkspace,
  setWorksheetErrorDetail,
  lastWorksheetPromptRef,
  openHandoff,
  autoSpeakEnabled,
  speak,
}: UseChatStreamOptions) {
  const { activeChatIdRef } = sessionRefs;

  const streamAssistantReply = useCallback(
    async (
      contextMessages: IdaMessage[],
      streamId: string,
      chatIdAtSend: string,
      apiSessionId: string,
      apiUserId: string,
      useWebSearch: boolean,
      useResearch: boolean,
      useWorksheet: boolean,
      researchTopic?: string,
    ) => {
      const streamingPlaceholder: IdaMessage = {
        id: streamId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      const messageState: StreamMessageState = {
        messages: [...contextMessages, streamingPlaceholder],
      };

      const sendFlags: StreamSendFlags = {
        useWebSearch,
        useResearch,
        useWorksheet,
      };

      const isActiveChat = () => activeChatIdRef.current === chatIdAtSend;

      const bridgeDeps: StreamToolBridgeDeps = {
        locale,
        tools,
        persistCurrentChat,
        setMessages,
        setWorksheetWorkspace,
        setWorksheetErrorDetail,
        worksheetWorkspaceRef,
        lastWorksheetPromptRef,
        worksheetCreatedLabel: copy.worksheetCreated,
      };

      const bridge = createStreamToolBridge(
        bridgeDeps,
        {
          chatIdAtSend,
          streamId,
          contextMessages,
          researchTopic,
          isActiveChat,
        },
        messageState,
      );

      const syncMessages = () => {
        syncStreamMessages(
          messageState,
          { setMessages, persistCurrentChat },
          isActiveChat(),
        );
      };

      try {
        const requestBody = buildChatApiRequestBody({
          locale,
          sessionId: apiSessionId,
          userId: apiUserId,
          messages: contextMessages,
          webSearch: useWebSearch,
          research: useResearch,
          worksheet: useWorksheet,
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };

          if (response.status === 429) {
            throw new Error(copy.errors.rateLimit);
          }

          throw new Error(data.error ?? copy.errors.generic);
        }

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("text/event-stream")) {
          throw new Error(copy.errors.generic);
        }

        await consumeIdaSseStream(
          response,
          (token) => {
            messageState.messages = messageState.messages.map((message) =>
              message.id === streamId
                ? { ...message, content: message.content + token }
                : message,
            );
            syncMessages();
          },
          (meta: IdaSseMetaPayload) => {
            if (meta.handoffTriggered && meta.handoffPrefill) {
              openHandoff(meta.handoffPrefill);
            }

            bridge.onWebSearchMeta(
              meta.webSearchSources,
              meta.webSearchQueries,
            );
            bridge.onResearchMeta(
              meta.researchSources,
              meta.researchQueries,
              meta.researchSummary,
            );
          },
          (done) => {
            bridge.onWebSearchMeta(done.webSearchSources);
            bridge.onResearchMeta(
              done.researchSources,
              done.researchQueries,
              done.researchSummary,
            );

            if (done.message?.trim()) {
              messageState.messages = messageState.messages.map((message) =>
                message.id === streamId
                  ? { ...message, content: done.message }
                  : message,
              );
              syncMessages();
            }

            if (done.worksheet) {
              bridge.onWorksheetDone(done.worksheet);
            } else if (done.worksheetError && useWorksheet) {
              bridge.onWorksheetError(done.worksheetError);
            }
          },
        );

        if (!isActiveChat()) {
          persistCurrentChat({ messages: messageState.messages });
        }

        const assistantReply = messageState.messages.find(
          (message) => message.id === streamId,
        );
        if (autoSpeakEnabled && assistantReply?.content.trim()) {
          speak(streamId, assistantReply.content);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : copy.errors.generic;

        bridge.onStreamError(errorMessage, sendFlags);
        setError(errorMessage);
        throw err;
      }
    },
    [
      activeChatIdRef,
      autoSpeakEnabled,
      copy.errors,
      copy.worksheetCreated,
      lastWorksheetPromptRef,
      locale,
      openHandoff,
      persistCurrentChat,
      setError,
      setMessages,
      setWorksheetErrorDetail,
      setWorksheetWorkspace,
      speak,
      tools,
      worksheetWorkspaceRef,
    ],
  );

  return { streamAssistantReply };
}