"use client";

import {
  Check,
  Copy,
  Pencil,
  Pause,
  RefreshCw,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  type MessageReaction,
  useMessageReactions,
} from "@/lib/message-reactions";
import { useSpeechSynthesis } from "@/lib/voice/use-speech-synthesis";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  messageId: string;
  content: string;
  locale: Locale;
  isAssistant?: boolean;
  showRegenerate?: boolean;
  showEdit?: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function MessageActions({
  messageId,
  content,
  locale,
  isAssistant = false,
  showRegenerate = false,
  showEdit = false,
  onRegenerate,
  onEdit,
  className,
}: MessageActionsProps) {
  const copy = COPY[locale];
  const [copied, setCopied] = useState(false);
  const { getReaction, toggleReaction } = useMessageReactions();
  const reaction = getReaction(messageId);
  const { isSupported, speakingMessageId, toggle } = useSpeechSynthesis();
  const isSpeaking = speakingMessageId === messageId;

  if (!content.trim()) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(copy.copySuccess);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy.errors.generic);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "IDA", text: content });
        return;
      }
      await navigator.clipboard.writeText(content);
      toast.success(copy.shareSuccess);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(copy.errors.generic);
    }
  };

  const handleReaction = (value: MessageReaction) => {
    toggleReaction(messageId, value);
    toast.success(
      value === "up" ? copy.reactionThanks : copy.reactionFeedback,
      { duration: 2000 },
    );
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 pt-1",
        "opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100",
        className,
      )}
    >
      <ActionButton
        label={copy.copyMessage}
        onClick={handleCopy}
        active={copied}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </ActionButton>

      {showEdit && onEdit ? (
        <ActionButton label={copy.editMessage} onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </ActionButton>
      ) : null}

      {isAssistant ? (
        <ActionButton label={copy.shareMessage} onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5" />
        </ActionButton>
      ) : null}

      {isAssistant && isSupported ? (
        <ActionButton
          label={isSpeaking ? copy.stopSpeaking : copy.speakMessage}
          onClick={() => toggle(messageId, content)}
          active={isSpeaking}
        >
          {isSpeaking ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </ActionButton>
      ) : null}

      {isAssistant && showRegenerate && onRegenerate ? (
        <ActionButton label={copy.regenerate} onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
        </ActionButton>
      ) : null}

      {isAssistant ? (
        <>
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
          <ActionButton
            label={copy.thumbsUp}
            onClick={() => handleReaction("up")}
            active={reaction === "up"}
          >
            <ThumbsUp
              className={cn(
                "h-3.5 w-3.5",
                reaction === "up" && "fill-primary text-primary",
              )}
            />
          </ActionButton>
          <ActionButton
            label={copy.thumbsDown}
            onClick={() => handleReaction("down")}
            active={reaction === "down"}
          >
            <ThumbsDown
              className={cn(
                "h-3.5 w-3.5",
                reaction === "down" && "fill-destructive text-destructive",
              )}
            />
          </ActionButton>
        </>
      ) : null}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group/action relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "h-9 w-9 rounded-lg text-muted-foreground sm:h-7 sm:w-7",
          "hover:bg-muted hover:text-foreground active:scale-95",
          active && "bg-primary/10 text-foreground",
        )}
      >
        {children}
      </Button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2",
          "whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md",
          "opacity-0 transition-opacity duration-150",
          "group-hover/action:opacity-100 group-focus-within/action:opacity-100",
        )}
      >
        {label}
      </span>
    </div>
  );
}