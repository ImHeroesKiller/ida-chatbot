"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChatHeader } from "@/components/chat/header";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { QuickReplies } from "@/components/chat/quick-replies";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { consumeIdaSseStream } from "@/lib/client/parse-sse";
import { useAppFeatures } from "@/lib/client/use-app-features";
import { useChatStore, WELCOME_MESSAGE_ID } from "@/lib/chat-store";
import { IDA_CONFIG } from "@/lib/config";
import { filterQuickReplies, getQuickReplies } from "@/lib/handoff";
import { COPY } from "@/lib/i18n";
import { MessageReactionsProvider } from "@/lib/message-reactions";
import { useSidebarExpanded } from "@/lib/sidebar-prefs";
import type { IdaAttachment, IdaMessage } from "@/lib/types";
import type { IdaSseMetaPayload } from "@/lib/sse";
import {
  SpeechSynthesisProvider,
  useSpeechSynthesis,
} from "@/lib/voice/use-speech-synthesis";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
import { RightSidebar } from "@/components/chat/right-sidebar";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { useChatFontSize } from "@/lib/chat-font-prefs";
import { useWebSearchPrefs } from "@/lib/web-search-prefs";

function createMessageId() {
  return `ida-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toApiMessages(messages: IdaMessage[]) {
  return messages
    .filter((message) => message.id !== WELCOME_MESSAGE_ID)
    .map(({ role, content }) => ({ role, content }));
}

function ChatRoomContent() {
  const { locale, openHandoff, closeHandoff } = useChatContext();
  const copy = COPY[locale];
  const { expanded: sidebarExpanded, setExpanded: setSidebarExpanded } =
    useSidebarExpanded();
  const { prefs } = useVoicePrefs();
  const { enabled: webSearchEnabled, setEnabled: setWebSearchEnabled } =
    useWebSearchPrefs();
  const { fontSize: chatFontSize } = useChatFontSize();
  const { speak } = useSpeechSynthesis();
  const appFeatures = useAppFeatures();
  const webSearchAvailable = Boolean(
    appFeatures?.webSearchAvailable && appFeatures?.features.webSearch,
  );

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
  const [quickReplies, setQuickReplies] = useState<string[]>(
    filterQuickReplies(getQuickReplies(locale)),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightSidebarPanel | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const hasUserMessages = messages.some((message) => message.role === "user");

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

  useEffect(() => {
    if (!hydrated || !currentChat) return;

    if (activeChatIdRef.current === currentChat.id) return;

    activeChatIdRef.current = currentChat.id;
    setMessages(currentChat.messages);
    setQuickReplies(filterQuickReplies(currentChat.quickReplies));
    setInput("");
    setError(null);
    setStreamingMessageId(null);
    setIsLoading(false);
    setEditingMessageId(null);
    setRightPanel(null);
  }, [hydrated, currentChat]);

  useEffect(() => {
    if (!hydrated || isLoading) return;

    persistCurrentChat({ messages, quickReplies });
  }, [messages, quickReplies, hydrated, isLoading, persistCurrentChat]);

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setMobileSidebarOpen(false);
      closeHandoff();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeHandoff]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      switchChat(chatId);
      setMobileSidebarOpen(false);
    },
    [switchChat],
  );

  const handleNewChat = useCallback(() => {
    createChat();
    setMobileSidebarOpen(false);
  }, [createChat]);

  const streamAssistantReply = useCallback(
    async (
      contextMessages: IdaMessage[],
      streamId: string,
      chatIdAtSend: string,
      apiSessionId: string,
      apiUserId: string,
      useWebSearch: boolean,
    ) => {
      const streamingPlaceholder: IdaMessage = {
        id: streamId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      let finalMessages = [...contextMessages, streamingPlaceholder];

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            sessionId: apiSessionId,
            ...(apiUserId ? { userId: apiUserId } : {}),
            ...(useWebSearch ? { webSearch: true } : {}),
            messages: toApiMessages(contextMessages),
          }),
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
        ) => {
          if (!sources?.length) return;

          finalMessages = finalMessages.map((message) =>
            message.id === streamId
              ? { ...message, webSearchSources: sources }
              : message,
          );

          if (activeChatIdRef.current === chatIdAtSend) {
            setMessages(finalMessages);
          } else {
            persistCurrentChat({ messages: finalMessages });
          }
        };

        const applyQuickReplies = (replies?: string[]) => {
          if (!replies?.length) return;

          const filtered = filterQuickReplies(replies);
          if (activeChatIdRef.current === chatIdAtSend) {
            setQuickReplies(filtered);
          }
          persistCurrentChat({ quickReplies: filtered });
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
            if (meta.quickReplies?.length) {
              const filtered = filterQuickReplies(meta.quickReplies);
              if (activeChatIdRef.current === chatIdAtSend) {
                setQuickReplies(filtered);
              } else {
                persistCurrentChat({ quickReplies: filtered });
              }
            }

            if (meta.handoffTriggered && meta.handoffPrefill) {
              openHandoff(meta.handoffPrefill);
            }

            applyWebSearchSources(meta.webSearchSources);
            applyQuickReplies(meta.quickReplies);
          },
          (done) => {
            applyWebSearchSources(done.webSearchSources);
            applyQuickReplies(done.quickReplies);
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
        if (activeChatIdRef.current === chatIdAtSend) {
          setMessages((prev) =>
            prev.filter((message) => message.id !== streamId),
          );
        }

        const message =
          err instanceof Error ? err.message : copy.errors.generic;
        setError(message);
        throw err;
      }
    },
    [
      copy.errors,
      locale,
      openHandoff,
      persistCurrentChat,
      appFeatures?.features.autoSpeak,
      prefs.autoSpeak,
      speak,
      webSearchAvailable,
      webSearchEnabled,
    ],
  );

  const sendMessage = async (
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
        webSearchAvailable && webSearchEnabled,
      );
    } finally {
      if (activeChatIdRef.current === chatIdAtSend) {
        setStreamingMessageId(null);
        setIsLoading(false);
      }
    }
  };

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
          webSearchAvailable && webSearchEnabled,
        );
      } finally {
        if (activeChatIdRef.current === chatIdAtSend) {
          setStreamingMessageId(null);
          setIsLoading(false);
        }
      }
    },
    [currentChat, isLoading, messages, streamAssistantReply, apiUserId],
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
          webSearchAvailable && webSearchEnabled,
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
      webSearchAvailable,
      webSearchEnabled,
    ],
  );

  const handleQuickReply = (message: string) => {
    void sendMessage(message);
  };

  const handleOpenToolPanel = useCallback((panel: RightSidebarPanel) => {
    setRightPanel((current) => (current === panel ? null : panel));
  }, []);

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

                {messages.map((message) => {
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
                      isWelcome={message.id === WELCOME_MESSAGE_ID}
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

          <div className="shrink-0">
            <div className="ida-message-width mx-auto w-full max-w-full overflow-hidden px-2.5 sm:px-5">
              <div className="mb-2 min-w-0 pt-2 sm:mb-3 sm:pt-3">
                <QuickReplies
                  replies={quickReplies}
                  disabled={isLoading}
                  onSelect={handleQuickReply}
                />
              </div>
            </div>

            <ChatComposer
              locale={locale}
              sessionId={currentChat?.apiSessionId}
              input={input}
              isLoading={isLoading}
              webSearchEnabled={webSearchEnabled}
              webSearchAvailable={webSearchAvailable}
              activeToolPanel={rightPanel}
              onWebSearchChange={setWebSearchEnabled}
              onOpenToolPanel={handleOpenToolPanel}
              onInputChange={setInput}
              onSend={(content, options) => void sendMessage(content, options)}
            />
          </div>
          </div>

          {rightPanel ? (
            <RightSidebar
              locale={locale}
              panel={rightPanel}
              onClose={() => setRightPanel(null)}
              className="hidden md:flex"
            />
          ) : null}
        </div>
      </div>

      <Sheet
        open={Boolean(rightPanel)}
        onOpenChange={(open) => {
          if (!open) setRightPanel(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(92vw,24rem)] gap-0 overflow-hidden p-0 md:hidden [&>button]:h-10 [&>button]:w-10"
        >
          {rightPanel ? (
            <RightSidebar
              locale={locale}
              panel={rightPanel}
              onClose={() => setRightPanel(null)}
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