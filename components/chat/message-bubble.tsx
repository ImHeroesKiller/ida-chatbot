"use client";

import { motion } from "framer-motion";
import { Check, Copy, Sparkles, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
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
  const copy = COPY[locale];
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const timestamp = message.createdAt
    ? formatMessageTime(message.createdAt, locale)
    : null;

  const handleCopy = async () => {
    if (!message.content.trim()) return;

    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success(copy.copySuccess);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy.errors.generic);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group/message flex w-full items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
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
          "flex min-w-0 max-w-[min(85%,32rem)] flex-col gap-1.5",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3",
              isUser
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md border bg-card text-card-foreground shadow-sm dark:border-border/80",
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

          {message.content.trim() && !isStreaming && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              aria-label={copy.copyMessage}
              title={copy.copyMessage}
              className={cn(
                "absolute -top-2 h-7 w-7 rounded-full border bg-background/95 shadow-sm backdrop-blur-sm",
                "opacity-100 transition-opacity sm:opacity-0 sm:group-hover/message:opacity-100",
                "focus-visible:opacity-100",
                isUser ? "-left-2" : "-right-2",
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
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