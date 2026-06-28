"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

import { ChatHeader } from "@/components/chat/header";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { ScrollToBottomButton } from "@/components/chat/scroll-to-bottom";
import { SidebarSkeleton } from "@/components/chat/sidebar-skeleton";

const ChatSidebar = dynamic(
  () =>
    import("@/components/chat/sidebar").then((mod) => ({
      default: mod.ChatSidebar,
    })),
  { loading: () => <SidebarSkeleton expanded={false} className="h-full w-14" /> },
);

const ChatComposer = dynamic(
  () =>
    import("@/components/chat/chat-composer").then((mod) => ({
      default: mod.ChatComposer,
    })),
  {
    loading: () => (
      <div className="shrink-0 border-t px-3 py-3 sm:px-5">
        <div className="ida-message-width mx-auto h-12 rounded-2xl bg-muted/40" />
      </div>
    ),
  },
);

const ChatEmptyState = dynamic(
  () =>
    import("@/components/chat/chat-empty-state").then((mod) => ({
      default: mod.ChatEmptyState,
    })),
);

const HandoffDialog = dynamic(
  () =>
    import("@/components/chat/handoff-dialog").then((mod) => ({
      default: mod.HandoffDialog,
    })),
  { ssr: false },
);

import { useChatContext } from "@/components/chat/chat-provider";
import {
  extractResearchTopicFromMessages,
  useToolsCoordinator,
} from "@/components/chat/tools/use-tools-coordinator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { requestChatComposerFocus } from "@/lib/client/focus-chat-composer";
import { buildChatApiRequestBody } from "@/lib/client/chat-api-payload";
import { consumeIdaSseStream } from "@/lib/client/parse-sse";
import { useIsMobileViewport } from "@/lib/client/use-media-query";
import { useAppFeatures } from "@/lib/client/use-app-features";
import {
  createEmptyWorksheet,
  useChatStore,
  WELCOME_MESSAGE_ID,
} from "@/lib/chat-store";
import { IDA_CONFIG } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { MessageReactionsProvider } from "@/lib/message-reactions";
import { useSidebarExpanded } from "@/lib/sidebar-prefs";
import type { ResearchSession } from "@/lib/research-types";
import type { IdaAttachment, IdaMessage, IdaWebSearchSource } from "@/lib/types";
import type { IdaSseDonePayload, IdaSseMetaPayload } from "@/lib/sse";
import toast from "react-hot-toast";

import {
  type WorksheetDocument,
  type WorksheetErrorCode,
} from "@/lib/worksheet";
import {
  addGeneratedWorksheetDocument,
  createEmptyWorksheetWorkspace,
  hasWorksheetWorkspaceContent,
  normalizeWorksheetDocument,
  recordWorksheetDocumentVersion,
  setWorksheetWorkspaceError,
  summarizeWorksheetPrompt,
  syncWorkspaceLegacyFields,
} from "@/lib/worksheet-workspace";
import {
  resolveWorksheetTemplate,
  type WorksheetTemplate,
} from "@/lib/worksheet-templates";
import {
  SpeechSynthesisProvider,
  useSpeechSynthesis,
} from "@/lib/voice/use-speech-synthesis";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
import { RightSidebar } from "@/components/chat/right-sidebar";
import { RightToolsRail } from "@/components/chat/right-tools-rail";
import { useChatFontSize } from "@/lib/chat-font-prefs";


function createMessageId() {
  return `ida-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ChatRoomContent() {
  const { locale, openHandoff, closeHandoff } = useChatContext();
  const copy = COPY[locale];
  const { expanded: sidebarExpanded, setExpanded: setSidebarExpanded } =
    useSidebarExpanded();
  const { prefs } = useVoicePrefs();
  const { fontSize: chatFontSize } = useChatFontSize();
  const { speak } = useSpeechSynthesis();
  const appFeatures = useAppFeatures();
  const webSearchAvailable = Boolean(
    appFeatures?.webSearchAvailable && appFeatures?.features.webSearch,
  );

  const tools = useToolsCoordinator({
    webSearchAvailable,
    researchAvailable: webSearchAvailable,
  });

  const {
    hydrated,
    apiUserId,
    currentChat,
    sessions,
    switchChat,
    createChat,
    pinChat,
    renameChat,
    deleteChat,
    clearAllChats,
    persistCurrentChat,
  } = useChatStore(locale);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<IdaMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [worksheetWorkspace, setWorksheetWorkspace] =
    useState<WorksheetDocument>(() => createEmptyWorksheetWorkspace(locale));
  const isMobileViewport = useIsMobileViewport();
  const rightPanelSheetOpen = Boolean(tools.activePanel) && isMobileViewport;

  const worksheetWorkspaceRef = useRef<WorksheetDocument>(
    createEmptyWorksheetWorkspace(locale),
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const localStateChatIdRef = useRef<string | null>(null);
  const [lastWorksheetPrompt, setLastWorksheetPrompt] = useState("");
  const lastWorksheetPromptRef = useRef("");
  const [worksheetErrorDetail, setWorksheetErrorDetail] = useState<
    string | null
  >(null);
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.id !== WELCOME_MESSAGE_ID),
    [messages],
  );

  const hasUserMessages = visibleMessages.some(
    (message) => message.role === "user",
  );

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (
        message?.role === "assistant" &&
        message.id !== WELCOME_MESSAGE_ID &&
        message.content.trim()
      ) {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  const lastUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message?.role === "user") {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(isLoading ? "auto" : "smooth");
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollButton(distanceFromBottom > 120);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hydrated, currentChat?.id]);

  useLayoutEffect(() => {
    if (!hydrated || !currentChat) return;
    if (localStateChatIdRef.current === currentChat.id) return;

    flushSync(() => {
      setMessages(currentChat.messages);
      setInput("");
      setError(null);
      setStreamingMessageId(null);
      setIsLoading(false);
      setEditingMessageId(null);
      tools.hydrateFromChat(currentChat);

      const worksheet = normalizeWorksheetDocument(currentChat.worksheet, locale);
      setWorksheetWorkspace(worksheet);
      worksheetWorkspaceRef.current = worksheet;
      setWorksheetErrorDetail(null);

      const lastUserMessage = [...currentChat.messages]
        .reverse()
        .find((message) => message.role === "user");
      setLastWorksheetPrompt(lastUserMessage?.content?.trim() ?? "");
    });

    activeChatIdRef.current = currentChat.id;
    localStateChatIdRef.current = currentChat.id;
  }, [hydrated, currentChat, locale, tools.hydrateFromChat]);

  useEffect(() => {
    worksheetWorkspaceRef.current = worksheetWorkspace;
  }, [worksheetWorkspace]);

  useEffect(() => {
    lastWorksheetPromptRef.current = lastWorksheetPrompt;
  }, [lastWorksheetPrompt]);

  const canPersistCurrentChatState = useCallback(() => {
    if (!currentChat) return false;
    if (activeChatIdRef.current === "__pending__") return false;
    return localStateChatIdRef.current === currentChat.id;
  }, [currentChat]);

  useEffect(() => {
    if (!hydrated || isLoading || !currentChat) return;
    if (!canPersistCurrentChatState()) return;

    persistCurrentChat({
      messages,
      ...tools.getPersistPatch(),
    });
  }, [
    currentChat,
    hydrated,
    isLoading,
    messages,
    canPersistCurrentChatState,
    persistCurrentChat,
    tools.activePanel,
    tools.getPersistPatch,
    tools.research.researchSessions,
    tools.research.isEnabled,
    tools.webSearch.isEnabled,
    tools.worksheet.isEnabled,
  ]);

  useEffect(() => {
    if (!hydrated || !currentChat) return;
    if (!canPersistCurrentChatState()) return;

    const worksheet = hasWorksheetWorkspaceContent(worksheetWorkspace)
      ? syncWorkspaceLegacyFields({
          ...worksheetWorkspace,
          updatedAt: Date.now(),
        })
      : createEmptyWorksheet();

    persistCurrentChat({ worksheet });
  }, [
    canPersistCurrentChatState,
    currentChat,
    hydrated,
    persistCurrentChat,
    worksheetWorkspace,
  ]);

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (tools.activePanel) {
        tools.collapsePanel();
        return;
      }

      setMobileSidebarOpen(false);
      closeHandoff();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeHandoff, tools]);

  useEffect(() => {
    if (!rightPanelSheetOpen) return;

    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  }, [rightPanelSheetOpen]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (!sessions.some((session) => session.id === chatId)) return;

      activeChatIdRef.current = "__pending__";
      localStateChatIdRef.current = null;
      switchChat(chatId);
      setMobileSidebarOpen(false);
    },
    [sessions, switchChat],
  );

  const handleNewChat = useCallback(() => {
    activeChatIdRef.current = "__pending__";
    localStateChatIdRef.current = null;

    flushSync(() => {
      setMessages([]);
      setInput("");
      setError(null);
      setStreamingMessageId(null);
      setIsLoading(false);
      setEditingMessageId(null);
      tools.resetForNewChat();

      const emptyWorksheet = normalizeWorksheetDocument(
        createEmptyWorksheet(),
        locale,
      );
      setWorksheetWorkspace(emptyWorksheet);
      worksheetWorkspaceRef.current = emptyWorksheet;
      setWorksheetErrorDetail(null);
      setLastWorksheetPrompt("");
    });

    createChat();
    setMobileSidebarOpen(false);
  }, [createChat, locale, tools]);

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

      let finalMessages = [...contextMessages, streamingPlaceholder];

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

        const applyWebSearchSources = (
          sources: IdaSseMetaPayload["webSearchSources"],
          queries?: string[],
        ) => {
          if (!sources?.length) return;

          finalMessages = finalMessages.map((message) =>
            message.id === streamId
              ? { ...message, webSearchSources: sources }
              : message,
          );

          if (activeChatIdRef.current === chatIdAtSend) {
            setMessages(finalMessages);
            tools.webSearch.setSearchResults(sources);
            if (queries?.length) {
              tools.webSearch.setLastQuery(queries[queries.length - 1] ?? null);
            }
            tools.activateWebSearch();
          } else {
            persistCurrentChat({
              messages: finalMessages,
              webSearchEnabled: true,
              activeRightPanel: tools.webSearch.panelId,
            });
          }
        };

        const applyResearchResults = (
          sources: IdaSseMetaPayload["researchSources"],
          queries?: string[],
          summary?: string,
        ) => {
          if (!sources?.length && !summary?.trim()) return;

          finalMessages = finalMessages.map((message) =>
            message.id === streamId
              ? {
                  ...message,
                  researchSources: sources,
                  researchQueries: queries,
                  researchSummary: summary,
                }
              : message,
          );

          const topic =
            researchTopic?.trim() ||
            extractResearchTopicFromMessages(contextMessages);

          if (activeChatIdRef.current === chatIdAtSend) {
            setMessages(finalMessages);
            tools.research.applyResearchFromMessage({
              topic,
              summary: summary ?? "",
              sources: sources ?? [],
              queries: queries ?? [],
            });
            tools.activateResearch();
          } else {
            persistCurrentChat({
              messages: finalMessages,
              researchEnabled: true,
              activeRightPanel: tools.research.panelId,
            });
          }
        };

        const applyWorksheet = (
          worksheet: NonNullable<IdaSseDonePayload["worksheet"]>,
        ) => {
          const next = addGeneratedWorksheetDocument(
            worksheetWorkspaceRef.current,
            {
              title: worksheet.title,
              content: worksheet.content,
              promptSummary: summarizeWorksheetPrompt(
                lastWorksheetPromptRef.current,
              ),
            },
            { activate: false },
          );
          const persisted = syncWorkspaceLegacyFields({
            ...next,
            updatedAt: Date.now(),
          });

          if (activeChatIdRef.current === chatIdAtSend) {
            setWorksheetWorkspace(next);
            setWorksheetErrorDetail(null);
            tools.activateWorksheet();
            toast.success(copy.worksheetCreated);
          }

          persistCurrentChat({
            worksheet: persisted,
            activeRightPanel: tools.worksheet.panelId,
            worksheetToolEnabled: true,
          });
        };

        const applyWorksheetError = (errorCode: string) => {
          const code = errorCode as WorksheetErrorCode;
          const next = setWorksheetWorkspaceError(
            worksheetWorkspaceRef.current,
            code,
            locale,
          );
          const persisted = syncWorkspaceLegacyFields({
            ...next,
            updatedAt: Date.now(),
          });

          if (activeChatIdRef.current === chatIdAtSend) {
            setWorksheetWorkspace(next);
            setWorksheetErrorDetail(null);
            tools.activateWorksheet();
          }

          persistCurrentChat({
            worksheet: persisted,
            activeRightPanel: tools.worksheet.panelId,
            worksheetToolEnabled: true,
          });
        };

        await consumeIdaSseStream(
          response,
          (token) => {
            finalMessages = finalMessages.map((message) =>
              message.id === streamId
                ? { ...message, content: message.content + token }
                : message,
            );

            if (activeChatIdRef.current === chatIdAtSend) {
              setMessages(finalMessages);
            } else {
              persistCurrentChat({ messages: finalMessages });
            }
          },
          (meta: IdaSseMetaPayload) => {
            if (meta.handoffTriggered && meta.handoffPrefill) {
              openHandoff(meta.handoffPrefill);
            }

            applyWebSearchSources(
              meta.webSearchSources,
              meta.webSearchQueries,
            );
            applyResearchResults(
              meta.researchSources,
              meta.researchQueries,
              meta.researchSummary,
            );
          },
          (done) => {
            applyWebSearchSources(done.webSearchSources);
            applyResearchResults(
              done.researchSources,
              done.researchQueries,
              done.researchSummary,
            );

            if (done.message?.trim()) {
              finalMessages = finalMessages.map((message) =>
                message.id === streamId
                  ? { ...message, content: done.message }
                  : message,
              );

              if (activeChatIdRef.current === chatIdAtSend) {
                setMessages(finalMessages);
              } else {
                persistCurrentChat({ messages: finalMessages });
              }
            }

            if (done.worksheet) {
              applyWorksheet(done.worksheet);
            } else if (done.worksheetError && useWorksheet) {
              applyWorksheetError(done.worksheetError);
            }
          },
        );

        if (activeChatIdRef.current !== chatIdAtSend) {
          persistCurrentChat({ messages: finalMessages });
        }

        const assistantReply = finalMessages.find(
          (message) => message.id === streamId,
        );
        if (
          appFeatures?.features.autoSpeak !== false &&
          prefs.autoSpeak &&
          assistantReply?.content.trim()
        ) {
          speak(streamId, assistantReply.content);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : copy.errors.generic;

        if (activeChatIdRef.current === chatIdAtSend) {
          setMessages((prev) =>
            prev.filter((message) => message.id !== streamId),
          );

          if (useWorksheet) {
            const next = setWorksheetWorkspaceError(
              worksheetWorkspaceRef.current,
              "generate_failed",
              locale,
            );
            setWorksheetWorkspace(next);
            setWorksheetErrorDetail(errorMessage);
            tools.activateWorksheet();
          }
        }

        if (useWorksheet) {
          const next = setWorksheetWorkspaceError(
            worksheetWorkspaceRef.current,
            "generate_failed",
            locale,
          );
          persistCurrentChat({
            worksheet: syncWorkspaceLegacyFields({
              ...next,
              updatedAt: Date.now(),
            }),
            activeRightPanel: tools.worksheet.panelId,
            worksheetToolEnabled: true,
          });
        }

        if (useWebSearch) {
          if (activeChatIdRef.current === chatIdAtSend) {
            tools.webSearch.finishSearchError(errorMessage);
            tools.openPanel(tools.webSearch.panelId);
          }
        }

        if (useResearch) {
          if (activeChatIdRef.current === chatIdAtSend) {
            tools.research.endChatResearch();
            tools.openPanel(tools.research.panelId);
          }
        }

        setError(errorMessage);
        throw err;
      }
    },
    [
      copy.errors,
      copy.worksheetCreated,
      locale,
      openHandoff,
      persistCurrentChat,
      appFeatures?.features.autoSpeak,
      prefs.autoSpeak,
      speak,
      tools,
    ],
  );

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
        tools.openPanel(tools.worksheet.panelId);
        setWorksheetWorkspace((prev) =>
          prev.error ? { ...prev, error: undefined } : prev,
        );
        setWorksheetErrorDetail(null);
      }

      if (webSearchAtSend && text) {
        tools.webSearch.beginSearch(text);
        tools.openPanel(tools.webSearch.panelId);
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
      tools,
      streamAssistantReply,
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
      streamAssistantReply,
      tools,
    ],
  );

  const handleEditMessage = useCallback((messageId: string) => {
    if (isLoading) return;
    setEditingMessageId(messageId);
  }, [isLoading]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

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
      streamAssistantReply,
      tools,
    ],
  );

  const handleWorksheetChange = useCallback((workspace: WorksheetDocument) => {
    setWorksheetWorkspace(workspace);
  }, []);

  const handleWorksheetApplyTemplate = useCallback(
    (template: WorksheetTemplate) => {
      const { title, content } = resolveWorksheetTemplate(template, locale);

      setWorksheetWorkspace((prev) => {
        const documentId = prev.activeDocumentId;
        const next = documentId
          ? recordWorksheetDocumentVersion(prev, documentId, {
              title,
              content,
              source: "template",
            })
          : addGeneratedWorksheetDocument(
              prev,
              { title, content },
              { activate: true },
            );
        return syncWorkspaceLegacyFields(next);
      });
      toast.success(copy.worksheetTemplateApplied);
    },
    [copy.worksheetTemplateApplied, locale],
  );

  const handleWorksheetClear = useCallback(() => {
    const emptyWorksheet = normalizeWorksheetDocument(createEmptyWorksheet(), locale);
    setWorksheetWorkspace(emptyWorksheet);
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
    persistCurrentChat({ worksheet: createEmptyWorksheet() });
  }, [locale, persistCurrentChat]);

  const handleWorksheetRetry = useCallback(() => {
    const prompt = lastWorksheetPrompt.trim();
    if (!prompt || isLoading) return;
    void sendMessage(prompt);
  }, [isLoading, lastWorksheetPrompt, sendMessage]);

  const handleWorksheetRegenerate = useCallback(() => {
    handleWorksheetRetry();
  }, [handleWorksheetRetry]);

  const handleWebSearchUseAsContext = useCallback(
    (result: IdaWebSearchSource) => {
      const snippet = `${result.title}\n${result.url}\n${result.snippet}`.trim();
      setInput((prev) => (prev.trim() ? `${prev}\n\n${snippet}` : snippet));
      requestChatComposerFocus();
    },
    [],
  );

  const handleResearchStart = useCallback(
    (topic: string, depth: "quick" | "standard" | "deep") => {
      void tools.research.startResearch(topic, depth, locale);
      tools.openPanel(tools.research.panelId);
    },
    [locale, tools],
  );

  const handleResearchSaveSession = useCallback(() => {
    const saved = tools.research.saveResearchSession();
    if (!saved) return;

    const nextSessions = [
      saved,
      ...tools.research.researchSessions.filter(
        (session) => session.id !== saved.id,
      ),
    ];
    tools.research.setSessions(nextSessions);
    persistCurrentChat({ researchSessions: nextSessions });
    toast.success(copy.researchSessionSaved);
  }, [copy.researchSessionSaved, persistCurrentChat, tools.research]);

  const createWorksheetFromResearch = useCallback(
    (session: ResearchSession) => {
      const content = session.summary || session.topic;
      const next = addGeneratedWorksheetDocument(
        worksheetWorkspaceRef.current,
        {
          title: session.topic,
          content,
          promptSummary: summarizeWorksheetPrompt(session.topic),
        },
        { activate: true },
      );
      const persisted = syncWorkspaceLegacyFields({
        ...next,
        updatedAt: Date.now(),
      });

      setWorksheetWorkspace(next);
      tools.activateWorksheet();
      persistCurrentChat({
        worksheet: persisted,
        worksheetToolEnabled: true,
        activeRightPanel: tools.worksheet.panelId,
      });
      toast.success(copy.worksheetCreated);
    },
    [copy.worksheetCreated, persistCurrentChat, tools],
  );

  const handleResearchOpenSession = useCallback(
    (session: ResearchSession) => {
      tools.research.applyResearchFromMessage({
        topic: session.topic,
        summary: session.summary,
        sources: session.sources,
        queries: session.queries,
        depth: session.depth,
      });
    },
    [tools.research],
  );

  const handleResearchCreateDocument = useCallback(
    (session: ResearchSession) => {
      createWorksheetFromResearch(session);
    },
    [createWorksheetFromResearch],
  );

  const handleResearchCreateDocumentFromCurrent = useCallback(() => {
    if (!tools.research.currentSession) return;
    createWorksheetFromResearch(tools.research.currentSession);
  }, [createWorksheetFromResearch, tools.research.currentSession]);

  const sharedToolPanelProps = {
    locale,
    webSearch: tools.webSearch,
    research: tools.research,
    worksheet: worksheetWorkspace,
    worksheetErrorDetail,
    worksheetGenerating: isLoading && tools.worksheet.isEnabled,
    worksheetCanRegenerate: Boolean(lastWorksheetPrompt.trim()),
    onWorksheetChange: handleWorksheetChange,
    onWorksheetApplyTemplate: handleWorksheetApplyTemplate,
    onWorksheetRetry: handleWorksheetRetry,
    onWorksheetRegenerate: handleWorksheetRegenerate,
    onWorksheetClear: handleWorksheetClear,
    onWebSearchUseAsContext: handleWebSearchUseAsContext,
    webSearchSearching:
      isLoading && tools.webSearch.isEnabled && tools.webSearch.isSearching,
    researchSearching:
      tools.research.isResearching ||
      (isLoading && tools.research.isEnabled && !tools.webSearch.isSearching),
    onResearchStart: handleResearchStart,
    onResearchSaveSession: handleResearchSaveSession,
    onResearchOpenSession: handleResearchOpenSession,
    onResearchCreateDocument: handleResearchCreateDocument,
    onResearchCreateDocumentFromCurrent: handleResearchCreateDocumentFromCurrent,
    onClose: tools.collapsePanel,
  };

  const sidebarProps = {
    sessions,
    currentChatId: currentChat?.id ?? "",
    locale,
    loading: !hydrated,
    onSelect: handleSelectChat,
    onPin: pinChat,
    onRename: renameChat,
    onDelete: deleteChat,
    onClearAll: clearAllChats,
  };

  return (
    <MessageReactionsProvider>
      <div
        className="ida-chat-shell flex h-dvh w-full max-w-full overflow-hidden bg-background font-sans"
        data-chat-font-size={chatFontSize}
        role="application"
        aria-label={copy.windowLabel}
      >
        <ChatSidebar
          {...sidebarProps}
          expanded={sidebarExpanded}
          onExpand={() => setSidebarExpanded(true)}
          onCollapse={() => setSidebarExpanded(false)}
          className="hidden shrink-0 border-r md:flex"
        />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          <ChatHeader
            title={currentChat?.title ?? IDA_CONFIG.name}
            subtitle={copy.subtitle}
            openSessionsLabel={copy.openSessions}
            newChatLabel={copy.newChat}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onNewChat={handleNewChat}
          />

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollContainerRef}
              className="h-full overflow-y-auto overscroll-y-contain px-2.5 py-3 sm:px-5 sm:py-4"
            >
              <div className="ida-message-width mx-auto flex w-full flex-col gap-[calc(1.5rem*var(--ida-gap-scale))]">
                {!hasUserMessages && <ChatEmptyState locale={locale} />}

                {visibleMessages.map((message) => {
                  const isStreaming = message.id === streamingMessageId;
                  const isEmptyStreaming =
                    isStreaming && message.content.length === 0;

                  if (isEmptyStreaming) {
                    return <MessageSkeleton key={message.id} />;
                  }

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      locale={locale}
                      isStreaming={isStreaming}
                      isLastAssistant={message.id === lastAssistantMessageId}
                      isLastUser={message.id === lastUserMessageId}
                      isEditing={editingMessageId === message.id}

                      onRegenerate={handleRegenerate}
                      onEdit={handleEditMessage}
                      onCancelEdit={handleCancelEdit}
                      onSubmitEdit={handleSubmitEdit}
                    />
                  );
                })}

                <div ref={messagesEndRef} className="h-px" aria-hidden />
              </div>
            </div>

            <ScrollToBottomButton
              visible={showScrollButton}
              locale={locale}
              onClick={() => scrollToBottom("smooth")}
            />
          </div>

          {error && (
            <p className="shrink-0 px-3 pb-2 text-center text-xs text-destructive sm:px-5">
              {error}
            </p>
          )}

          <div className="relative z-30 shrink-0">
            <ChatComposer
              key={currentChat?.id}
              locale={locale}
              sessionId={currentChat?.apiSessionId}
              input={input}
              isLoading={isLoading}
              webSearchAvailable={tools.webSearchAvailable}
              researchAvailable={tools.researchAvailable}
              isToolActive={tools.isToolActive}
              isAnyToolActive={tools.isAnyToolActive}
              onToolMenuClick={tools.handleMenuToolClick}
              onInputChange={setInput}
              onSend={(content, options) =>
                void sendMessage(content, options)
              }
            />
          </div>
          </div>

          <RightToolsRail
            locale={locale}
            railItems={tools.railItems}
            onRailClick={tools.handleRailClick}
            className="relative z-10 hidden shrink-0 md:flex"
          />

          {tools.activePanel ? (
            <RightSidebar
              key={`${currentChat?.id}-${tools.activePanel}`}
              {...sharedToolPanelProps}
              panel={tools.activePanel}
              className="relative z-10 hidden shrink-0 md:flex"
            />
          ) : null}
        </div>
      </div>

      <Sheet
        open={rightPanelSheetOpen}
        modal
        onOpenChange={(open) => {
          if (!open) tools.collapsePanel();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[min(100vw,26rem)] max-w-full gap-0 overflow-hidden border-l p-0 shadow-xl"
        >
          {tools.activePanel ? (
            <RightSidebar
              key={currentChat?.id}
              {...sharedToolPanelProps}
              panel={tools.activePanel}
              embedded
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[min(88vw,300px)] max-w-full gap-0 overflow-hidden p-0 [&>button]:h-10 [&>button]:w-10"
        >
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-sm">{copy.sessionsLabel}</SheetTitle>
          </SheetHeader>
          <ChatSidebar
            {...sidebarProps}
            expanded
            className="h-[calc(100%-3.5rem)] w-full"
          />
        </SheetContent>
      </Sheet>

      <HandoffDialog />
    </MessageReactionsProvider>
  );
}

export function ChatRoom() {
  return (
    <SpeechSynthesisProvider>
      <ChatRoomContent />
    </SpeechSynthesisProvider>
  );
}