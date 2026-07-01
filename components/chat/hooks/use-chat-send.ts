"use client";

import { useCallback, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

import { createMessageId } from "@/components/chat/hooks/chat-utils";
import { useChatStream } from "@/components/chat/hooks/use-chat-stream";
import type { ChatSessionRefs } from "@/components/chat/hooks/use-chat-session-refs";
import type { ToolSendCoordinator } from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import { IDA_CONFIG, type Locale } from "@/lib/config";
import type { IdaAttachment, IdaHandoffPrefill, IdaMessage } from "@/lib/types";
import type { WorksheetDocument } from "@/lib/worksheet";

interface UseChatSendOptions {
  locale: Locale;
  apiUserId: string;
  currentChat: ChatSession | null;
  messages: IdaMessage[];
  setMessages: Dispatch<SetStateAction<IdaMessage[]>>;
  tools: ToolSendCoordinator;
  sessionRefs: ChatSessionRefs;
  persistCurrentChat: (patch: Partial<ChatSession>) => void;
  worksheetWorkspaceRef: RefObject<WorksheetDocument>;
  setLastWorksheetPrompt: Dispatch<SetStateAction<string>>;
  setWorksheetWorkspace: Dispatch<SetStateAction<WorksheetDocument>>;
  setWorksheetErrorDetail: Dispatch<SetStateAction<string | null>>;
  lastWorksheetPromptRef: RefObject<string>;
  setEditingMessageId: Dispatch<SetStateAction<string | null>>;
  openHandoff: (prefill: IdaHandoffPrefill) => void;
  autoSpeakEnabled: boolean;
  speak: (messageId: string, content: string) => void;
  isMobileViewport: boolean;
  copy: {
    errors: {
      rateLimit: string;
      generic: string;
      tooLong: string;
    };
    worksheetCreated: string;
  };
}

export function useChatSend({
  locale,
  apiUserId,
  currentChat,
  messages,
  setMessages,
  tools,
  sessionRefs,
  persistCurrentChat,
  worksheetWorkspaceRef,
  setLastWorksheetPrompt,
  setWorksheetWorkspace,
  setWorksheetErrorDetail,
  lastWorksheetPromptRef,
  setEditingMessageId,
  openHandoff,
  autoSpeakEnabled,
  speak,
  isMobileViewport,
  copy,
}: UseChatSendOptions) {
  const { activeChatIdRef } = sessionRefs;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const { streamAssistantReply } = useChatStream({
    locale,
    copy: {
      errors: copy.errors,
      worksheetCreated: copy.worksheetCreated,
    },
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
    isMobileViewport,
  });

  const executeSendMessage = useCallback(
    async (
      rawText: string,
      options?: {
        attachment?: IdaAttachment;
        isVoiceNote?: boolean;
        caption?: string;
      },
    ) => {
      const text = rawText.trim();
      if ((!text && !options?.attachment) || isLoading || !currentChat) return;

      if (text.length > IDA_CONFIG.maxMessageLength) {
        setError(copy.errors.tooLong);
        return;
      }

      setError(null);

      const worksheetAtSend = tools.worksheetAtSend;
      if (worksheetAtSend && text) {
        setLastWorksheetPrompt(text);
      }
      const researchAtSend = tools.researchAtSend;
      const webSearchAtSend = tools.webSearchAtSend;

      if (worksheetAtSend) {
        tools.worksheet.beginRegenerate();
        tools.openPanel(tools.worksheet.panelId);
        if (tools.worksheet.syncToPersistLayer) {
          tools.worksheet.syncToPersistLayer();
        } else {
          setWorksheetWorkspace((prev) =>
            prev.error ? { ...prev, error: undefined } : prev,
          );
        }
        tools.worksheet.clearErrorDetail?.();
        setWorksheetErrorDetail(null);
      }

      if (webSearchAtSend && text) {
        tools.webSearch.beginSearch(text);
        if (!isMobileViewport) {
          tools.openPanel(tools.webSearch.panelId);
        }
      }

      if (researchAtSend && text) {
        tools.research.beginChatResearch();
        tools.openPanel(tools.research.panelId);
      }

      const userMessage: IdaMessage = {
        id: createMessageId(),
        role: "user",
        content: text,
        caption: options?.caption,
        attachment: options?.attachment,
        isVoiceNote: options?.isVoiceNote,
        createdAt: Date.now(),
      };

      const nextMessages = [...messages, userMessage];
      const streamId = createMessageId();

      setMessages([
        ...nextMessages,
        {
          id: streamId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);
      setStreamingMessageId(streamId);
      setInput("");
      setIsLoading(true);

      const chatIdAtSend = currentChat.id;

      try {
        await streamAssistantReply(
          nextMessages,
          streamId,
          chatIdAtSend,
          currentChat.apiSessionId,
          apiUserId,
          webSearchAtSend,
          researchAtSend,
          worksheetAtSend,
          text,
        );
      } finally {
        if (activeChatIdRef.current === chatIdAtSend) {
          setStreamingMessageId(null);
          setIsLoading(false);
          if (webSearchAtSend) {
            tools.webSearch.endSearch();
          }
          if (researchAtSend) {
            tools.research.endChatResearch();
          }
        }
      }
    },
    [
      apiUserId,
      copy.errors.tooLong,
      currentChat,
      isLoading,
      messages,
      setLastWorksheetPrompt,
      setWorksheetErrorDetail,
      setWorksheetWorkspace,
      setMessages,
      streamAssistantReply,
      tools,
      activeChatIdRef,
      isMobileViewport,
    ],
  );

  const sendMessage = useCallback(
    async (
      rawText: string,
      options?: {
        attachment?: IdaAttachment;
        isVoiceNote?: boolean;
        caption?: string;
      },
    ) => {
      const text = rawText.trim();
      if ((!text && !options?.attachment) || isLoading || !currentChat) return;

      await executeSendMessage(rawText, options);
    },
    [currentChat, executeSendMessage, isLoading],
  );

  const handleRegenerate = useCallback(
    async (assistantMessageId: string) => {
      if (isLoading || !currentChat) return;

      const assistantIndex = messages.findIndex(
        (message) => message.id === assistantMessageId,
      );
      if (assistantIndex <= 0) return;

      const contextMessages = messages.slice(0, assistantIndex);
      const lastMessage = contextMessages[contextMessages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") return;

      setError(null);
      const streamId = createMessageId();

      setMessages([
        ...contextMessages,
        {
          id: streamId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);
      setStreamingMessageId(streamId);
      setIsLoading(true);

      const chatIdAtSend = currentChat.id;

      try {
        await streamAssistantReply(
          contextMessages,
          streamId,
          chatIdAtSend,
          currentChat.apiSessionId,
          apiUserId,
          tools.webSearchAtSend,
          tools.researchAtSend,
          tools.worksheetAtSend,
          lastMessage.content,
        );
      } finally {
        if (activeChatIdRef.current === chatIdAtSend) {
          setStreamingMessageId(null);
          setIsLoading(false);
        }
      }
    },
    [
      apiUserId,
      currentChat,
      isLoading,
      messages,
      setError,
      setIsLoading,
      setMessages,
      setStreamingMessageId,
      streamAssistantReply,
      tools,
      activeChatIdRef,
    ],
  );

  const handleSubmitEdit = useCallback(
    async (messageId: string, newContent: string) => {
      const text = newContent.trim();
      if (!text || isLoading || !currentChat) return;

      if (text.length > IDA_CONFIG.maxMessageLength) {
        setError(copy.errors.tooLong);
        return;
      }

      const messageIndex = messages.findIndex(
        (message) => message.id === messageId,
      );
      if (messageIndex < 0) return;

      const targetMessage = messages[messageIndex];
      if (!targetMessage || targetMessage.role !== "user") return;

      const updatedUserMessage: IdaMessage =
        targetMessage.caption != null
          ? { ...targetMessage, caption: text }
          : { ...targetMessage, content: text };

      const contextMessages = [
        ...messages.slice(0, messageIndex),
        updatedUserMessage,
      ];

      setError(null);
      setEditingMessageId(null);

      const streamId = createMessageId();

      setMessages([
        ...contextMessages,
        {
          id: streamId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);
      setStreamingMessageId(streamId);
      setIsLoading(true);

      const chatIdAtSend = currentChat.id;

      try {
        await streamAssistantReply(
          contextMessages,
          streamId,
          chatIdAtSend,
          currentChat.apiSessionId,
          apiUserId,
          tools.webSearchAtSend,
          tools.researchAtSend,
          tools.worksheetAtSend,
          text,
        );
      } finally {
        if (activeChatIdRef.current === chatIdAtSend) {
          setStreamingMessageId(null);
          setIsLoading(false);
        }
      }
    },
    [
      apiUserId,
      copy.errors.tooLong,
      currentChat,
      isLoading,
      messages,
      setError,
      setIsLoading,
      setMessages,
      setStreamingMessageId,
      streamAssistantReply,
      setEditingMessageId,
      tools,
      activeChatIdRef,
    ],
  );

  const handleEditMessage = useCallback(
    (messageId: string) => {
      if (isLoading) return;
      setEditingMessageId(messageId);
    },
    [isLoading, setEditingMessageId],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, [setEditingMessageId]);

  return {
    input,
    setInput,
    isLoading,
    setIsLoading,
    streamingMessageId,
    setStreamingMessageId,
    error,
    setError,
    sendMessage,
    handleRegenerate,
    handleEditMessage,
    handleCancelEdit,
    handleSubmitEdit,
  };
}