"use client";

import { Menu, Sparkles, Volume2, VolumeX } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { HandoffDialog } from "@/components/chat/handoff-dialog";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { QuickReplies } from "@/components/chat/quick-replies";
import { ScrollToBottomButton } from "@/components/chat/scroll-to-bottom";
import { ChatSidebar } from "@/components/chat/sidebar";
import { useChatContext } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
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
import { buildHandoffPrefill, getQuickReplies } from "@/lib/handoff";
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
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpanded();
  const { prefs, setPrefs } = useVoicePrefs();
  const { speak } = useSpeechSynthesis();
  const appFeatures = useAppFeatures();

  const {
    hydrated,
    userId,
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
    getQuickReplies(locale),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

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
    setQuickReplies(currentChat.quickReplies);
    setInput("");
    setError(null);
    setStreamingMessageId(null);
    setIsLoading(false);
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

  const handleSmartHandoff = useCallback(() => {
    const apiMessages = toApiMessages(messages);
    const handoff = buildHandoffPrefill(apiMessages, locale);
    openHandoff(handoff);
  }, [locale, messages, openHandoff]);

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
      anonymousUserId: string,
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
            ...(anonymousUserId ? { userId: anonymousUserId } : {}),
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
              if (activeChatIdRef.current === chatIdAtSend) {
                setQuickReplies(meta.quickReplies);
              } else {
                persistCurrentChat({ quickReplies: meta.quickReplies });
              }
            }

            if (meta.handoffTriggered && meta.handoffPrefill) {
              openHandoff(meta.handoffPrefill);
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
        userId,
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
          userId,
        );
      } finally {
        if (activeChatIdRef.current === chatIdAtSend) {
          setStreamingMessageId(null);
          setIsLoading(false);
        }
      }
    },
    [currentChat, isLoading, messages, streamAssistantReply, userId],
  );

  const handleQuickReply = (message: string) => {
    void sendMessage(message);
  };

  const sidebarProps = {
    sessions,
    currentChatId: currentChat?.id ?? "",
    locale,
    loading: !hydrated,
    onSelect: handleSelectChat,
    onNewChat: handleNewChat,
    onPin: pinChat,
    onRename: renameChat,
    onDelete: deleteChat,
    onClearAll: clearAllChats,
  };

  return (
    <MessageReactionsProvider>
      <div
        className="flex h-dvh w-full overflow-hidden bg-background font-sans"
        role="application"
        aria-label={copy.windowLabel}
      >
        <ChatSidebar
          {...sidebarProps}
          expanded={sidebarExpanded}
          onToggleExpanded={toggleSidebar}
          className="hidden shrink-0 border-r md:flex"
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-2.5 border-b px-3 py-3 sm:gap-3 sm:px-5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 transition-transform hover:scale-105 active:scale-95 md:hidden"
              aria-label={copy.openSessions}
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 dark:bg-primary/15 sm:h-10 sm:w-10">
              <Sparkles className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight">
                {currentChat?.title ?? IDA_CONFIG.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {copy.subtitle}
              </p>
            </div>

            <Button
              type="button"
              variant={prefs.autoSpeak ? "default" : "outline"}
              size="icon-sm"
              className="shrink-0 transition-transform hover:scale-105 active:scale-95"
              aria-label={copy.autoSpeak}
              title={copy.autoSpeak}
              onClick={() => setPrefs({ autoSpeak: !prefs.autoSpeak })}
            >
              {prefs.autoSpeak ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="hidden h-8 shrink-0 text-xs transition-colors sm:inline-flex"
              onClick={handleSmartHandoff}
            >
              {copy.handoff}
            </Button>
          </header>

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollContainerRef}
              className="h-full overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-5"
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
                      onRegenerate={handleRegenerate}
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
            <div className="ida-message-width mx-auto w-full px-3 sm:px-5">
              <div className="mb-3 pt-3">
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
              onInputChange={setInput}
              onSend={(content, options) => void sendMessage(content, options)}
            />
          </div>
        </div>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[min(85vw,300px)] gap-0 p-0">
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