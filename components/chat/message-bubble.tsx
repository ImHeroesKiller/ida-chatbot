"use client";

import { motion } from "framer-motion";
import { Mic, User } from "lucide-react";

import { IdaLogo } from "@/components/brand/ida-logo";
import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { MessageActions } from "@/components/chat/message-actions";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
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
  const copy = COPY[locale];
  const isUser = message.role === "user";
  const timestamp = message.createdAt
    ? formatMessageTime(message.createdAt, locale)
    : null;

  const displayText = isUser
    ? (message.caption ?? message.content)
    : message.content;

  const showActions =
    !isStreaming && message.content.trim() && !isWelcome;

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
      {isUser ? (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
            "transition-transform duration-200 group-hover/message:scale-105",
          )}
          aria-hidden
        >
          <User className="h-4 w-4" />
        </div>
      ) : (
        <IdaLogo
          size="md"
          variant="avatar"
          className="transition-transform duration-200 group-hover/message:scale-105"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "flex min-w-0 max-w-[min(88%,34rem)] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        {message.attachment && (
          <AttachmentPreview
            attachment={message.attachment}
            extractedLabel={copy.extractedTextLabel}
            compact
            className={cn(isUser ? "w-full" : "")}
          />
        )}

        {(displayText.trim() || message.isVoiceNote) && (
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
            {message.isVoiceNote && (
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] opacity-80">
                <Mic className="h-3 w-3" />
                <span>{copy.voiceNoteLabel}</span>
              </div>
            )}

            {isUser ? (
              displayText.trim() ? (
                <p className="chat-text leading-relaxed whitespace-pre-wrap break-words">
                  {displayText}
                </p>
              ) : null
            ) : (
              <MarkdownContent
                content={message.content}
                isStreaming={isStreaming}
                className="chat-text"
              />
            )}
          </div>
        )}

        {showActions && (
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