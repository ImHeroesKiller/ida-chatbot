"use client";

import { Loader2, Send, Sparkles, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { HandoffDialog } from "@/components/chat/handoff-dialog";
import { MessageBubble } from "@/components/chat/message-bubble";
import { QuickReplies } from "@/components/chat/quick-replies";
import { useChatContext } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { consumeIdaSseStream } from "@/lib/client/parse-sse";
import { IDA_CONFIG } from "@/lib/config";
import { buildHandoffPrefill, getQuickReplies } from "@/lib/handoff";
import { COPY } from "@/lib/i18n";
import type { IdaMessage } from "@/lib/types";
import type { IdaSseMetaPayload } from "@/lib/sse";
import { cn } from "@/lib/utils";

const WELCOME_MESSAGE_ID = "ida-welcome";
const SESSION_STORAGE_KEY = "ida-session-id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = `ida-${crypto.randomUUID()}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

function createMessageId() {
  return `ida-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toApiMessages(messages: IdaMessage[]) {
  return messages
    .filter((message) => message.id !== WELCOME_MESSAGE_ID)
    .map(({ role, content }) => ({ role, content }));
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const { locale, openHandoff } = useChatContext();
  const copy = COPY[locale];
  const inputId = useId();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [messages, setMessages] = useState<IdaMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>(
    getQuickReplies(locale),
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, streamingMessageId, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasWelcomed) {
      setMessages([
        {
          id: WELCOME_MESSAGE_ID,
          role: "assistant",
          content: copy.welcome,
        },
      ]);
      setHasWelcomed(true);
    }
  }, [isOpen, hasWelcomed, copy.welcome]);

  useEffect(() => {
    setQuickReplies(getQuickReplies(locale));
  }, [locale]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSmartHandoff = useCallback(() => {
    const apiMessages = toApiMessages(messages);
    const handoff = buildHandoffPrefill(apiMessages, locale);
    onClose();
    openHandoff(handoff);
  }, [locale, messages, onClose, openHandoff]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    if (text.length > IDA_CONFIG.maxMessageLength) {
      setError(copy.errors.tooLong);
      return;
    }

    setError(null);

    const userMessage: IdaMessage = {
      id: createMessageId(),
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    const streamId = createMessageId();
    const streamingPlaceholder: IdaMessage = {
      id: streamId,
      role: "assistant",
      content: "",
    };

    setMessages([...nextMessages, streamingPlaceholder]);
    setStreamingMessageId(streamId);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          sessionId: getOrCreateSessionId(),
          messages: toApiMessages(nextMessages),
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
          setMessages((prev) =>
            prev.map((message) =>
              message.id === streamId
                ? { ...message, content: message.content + token }
                : message,
            ),
          );
        },
        (meta: IdaSseMetaPayload) => {
          if (meta.quickReplies?.length) {
            setQuickReplies(meta.quickReplies);
          }
        },
      );
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== streamId));

      const message = err instanceof Error ? err.message : copy.errors.generic;
      setError(message);
    } finally {
      setStreamingMessageId(null);
      setIsLoading(false);
    }
  };

  const handleQuickReply = (message: string, isHandoff?: boolean) => {
    if (isHandoff) {
      handleSmartHandoff();
      return;
    }

    void sendMessage(message);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  if (!isOpen) return <HandoffDialog />;

  return (
    <>
      <div
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl",
          "inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] h-[min(70dvh,520px)]",
          "sm:inset-x-auto sm:bottom-24 sm:right-5 sm:h-[min(72dvh,560px)] sm:w-[min(100vw-2rem,400px)]",
        )}
        role="dialog"
        aria-label={copy.windowLabel}
      >
        <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                {IDA_CONFIG.name}
              </p>
              <p className="text-[11px] text-muted-foreground">{copy.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={copy.close}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b px-4 py-2.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full text-xs"
            onClick={handleSmartHandoff}
          >
            {copy.handoff}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={message.id === streamingMessageId}
              />
            ))}
            {isLoading && !streamingMessageId && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {error && (
          <p className="px-4 pb-2 text-center text-xs text-destructive">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="border-t bg-muted/30 p-3">
          <div className="mb-2">
            <QuickReplies
              replies={quickReplies}
              disabled={isLoading}
              handoffLabel={copy.handoff}
              onSelect={handleQuickReply}
            />
          </div>

          <div className="flex items-end gap-2">
            <label htmlFor={inputId} className="sr-only">
              {copy.inputLabel}
            </label>
            <Textarea
              id={inputId}
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={copy.inputPlaceholder}
              rows={1}
              disabled={isLoading}
              className="max-h-24 min-h-10 flex-1 resize-none rounded-2xl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              aria-label={copy.send}
              className="h-10 w-10 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {copy.disclaimer}
          </p>
        </form>
      </div>
      <HandoffDialog />
    </>
  );
}