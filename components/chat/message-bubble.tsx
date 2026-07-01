"use client";

import { motion } from "framer-motion";

import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { MessageEditForm } from "@/components/chat/message-edit-form";
import { WebSearchSources } from "@/components/chat/web-search-sources";
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
  isLastUser?: boolean;
  isEditing?: boolean;

  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: (messageId: string, content: string) => void;
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
  isLastUser = false,
  isEditing = false,

  onRegenerate,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
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
    !isStreaming &&
    !isEditing &&
    displayText.trim() &&
    !isWelcome;

  const actionContent = displayText.trim();

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: isUser ? 14 : -14,
        y: 10,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={cn(
        "group/message flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 w-full max-w-[min(94%,36rem)] flex-col gap-1.5 sm:max-w-[min(90%,36rem)]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {message.attachment && !isEditing ? (
          <AttachmentPreview
            attachment={message.attachment}
            extractedLabel={copy.extractedTextLabel}
            compact
            className={cn(isUser ? "w-full" : "")}
          />
        ) : null}

        {isEditing && isUser ? (
          <div
            className={cn(
              "w-full rounded-[22px] border border-border/50 bg-card px-4 py-4 shadow-lg",
              "rounded-br-md",
            )}
          >
            <MessageEditForm
              locale={locale}
              initialValue={displayText}
              onSubmit={(value) => onSubmitEdit?.(message.id, value)}
              onCancel={() => onCancelEdit?.()}
            />
          </div>
        ) : (displayText.trim() || message.isVoiceNote) ? (
          <div
            className={cn(
              "max-w-full px-4 py-3.5 transition-all duration-300 sm:px-5 sm:py-4",
              isUser
                ? "rounded-[22px] rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/15 ring-1 ring-primary/20"
                : "rounded-[22px] rounded-bl-md border border-border/45 bg-[#F5F5F7] text-foreground shadow-sm dark:border-border/35 dark:bg-[#1C1C1E] dark:shadow-md",
              isWelcome &&
                "border-primary/25 bg-primary/5 ring-2 ring-primary/10 dark:bg-primary/10",
            )}
          >
            {message.isVoiceNote ? (
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">
                {copy.voiceNoteLabel}
              </p>
            ) : null}

            {isUser ? (
              displayText.trim() ? (
                <p className="chat-text whitespace-pre-wrap break-words font-medium">
                  {displayText}
                </p>
              ) : null
            ) : (
              <MarkdownContent
                content={message.content}
                isStreaming={isStreaming}
                locale={locale}
              />
            )}
          </div>
        ) : null}

        {!isUser && !isEditing && message.webSearchSources?.length ? (
          <div className="mt-0.5 w-full">
            <WebSearchSources
              sources={message.webSearchSources}
              locale={locale}
            />
          </div>
        ) : null}

        <div className="flex items-center gap-3 px-1.5">
          {timestamp && !isEditing ? (
            <time
              dateTime={new Date(message.createdAt!).toISOString()}
              className="text-[11px] font-medium text-muted-foreground/55"
            >
              {timestamp}
            </time>
          ) : null}

          {showActions ? (
            <div className="opacity-0 transition-opacity group-hover/message:opacity-100">
              <MessageActions
                messageId={message.id}
                content={actionContent}
                locale={locale}
                isAssistant={!isUser}
                showRegenerate={isLastAssistant}
                showEdit={isUser && isLastUser}
                onRegenerate={
                  onRegenerate ? () => onRegenerate(message.id) : undefined
                }
                onEdit={onEdit ? () => onEdit(message.id) : undefined}
              />
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}