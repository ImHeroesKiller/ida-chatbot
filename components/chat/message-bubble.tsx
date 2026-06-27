"use client";

import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { MessageActions } from "@/components/chat/message-actions";
import type { Locale } from "@/lib/config";
import type { IdaMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: IdaMessage;
  locale: Locale;
  isStreaming?: boolean;
  isWelcome?: boolean;
  isLastAssistant?: boolean;
  onRegenerate?: (messageId: string) => void;
}

function formatMessageTime(timestamp: number, locale: Locale): string {
  const localeTag =
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID";

  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function MessageBubble({
  message,
  locale,
  isStreaming,
  isWelcome,
  isLastAssistant,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = message.createdAt
    ? formatMessageTime(message.createdAt, locale)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ scale: 1.002 }}
      className={cn(
        "group/message flex w-full items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200",
          "group-hover/message:scale-105",
          isUser
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15",
        )}
        aria-hidden
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 max-w-[min(88%,34rem)] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 transition-shadow duration-200",
            "group-hover/message:shadow-md",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground shadow-sm"
              : "rounded-bl-md border bg-card text-card-foreground shadow-sm dark:border-border/80",
            isWelcome && "ring-1 ring-primary/15",
          )}
        >
          {isUser ? (
            <p className="chat-text leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <MarkdownContent
              content={message.content}
              isStreaming={isStreaming}
              className="chat-text"
            />
          )}
        </div>

        {!isStreaming && message.content.trim() && !isWelcome && (
          <MessageActions
            messageId={message.id}
            content={message.content}
            locale={locale}
            isAssistant={!isUser}
            showRegenerate={isLastAssistant}
            onRegenerate={
              onRegenerate ? () => onRegenerate(message.id) : undefined
            }
          />
        )}

        {timestamp && (
          <time
            dateTime={new Date(message.createdAt!).toISOString()}
            className="px-1 text-[11px] text-muted-foreground"
          >
            {timestamp}
          </time>
        )}
      </div>
    </motion.div>
  );
}