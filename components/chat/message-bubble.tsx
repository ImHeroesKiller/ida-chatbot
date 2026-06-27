"use client";

import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";

import { MarkdownContent } from "@/components/chat/markdown-content";
import type { Locale } from "@/lib/config";
import type { IdaMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: IdaMessage;
  locale: Locale;
  isStreaming?: boolean;
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
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = message.createdAt
    ? formatMessageTime(message.createdAt, locale)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary ring-1 ring-primary/15",
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
          "flex min-w-0 max-w-[min(85%,32rem)] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 sm:px-4",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border bg-card text-card-foreground shadow-sm",
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <MarkdownContent
              content={message.content}
              isStreaming={isStreaming}
            />
          )}
        </div>

        {timestamp && (
          <time
            dateTime={new Date(message.createdAt!).toISOString()}
            className="px-1 text-[10px] text-muted-foreground"
          >
            {timestamp}
          </time>
        )}
      </div>
    </motion.div>
  );
}