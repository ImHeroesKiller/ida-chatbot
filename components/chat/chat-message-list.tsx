"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { MessageSkeleton } from "@/components/chat/message-skeleton";
import type { Locale } from "@/lib/config";
import type { IdaMessage } from "@/lib/types";

const MessageBubble = dynamic(
  () =>
    import("@/components/chat/message-bubble").then((mod) => ({
      default: mod.MessageBubble,
    })),
  {
    loading: () => <MessageSkeleton />,
  },
);

const INITIAL_MESSAGE_WINDOW = 40;

interface ChatMessageListProps {
  locale: Locale;
  messages: IdaMessage[];
  streamingMessageId: string | null;
  lastAssistantMessageId: string | null;
  lastUserMessageId: string | null;
  editingMessageId: string | null;
  onRegenerate: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (messageId: string, content: string) => void;
  onOpenWorkflowPanel: () => void;
  onOpenWorksheetPanel: () => void;
  emptyState?: ReactNode;
}

export function ChatMessageList({
  locale,
  messages,
  streamingMessageId,
  lastAssistantMessageId,
  lastUserMessageId,
  editingMessageId,
  onRegenerate,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onOpenWorkflowPanel,
  onOpenWorksheetPanel,
  emptyState,
}: ChatMessageListProps) {
  const [renderAll, setRenderAll] = useState(false);

  const hiddenCount = useMemo(() => {
    if (renderAll || messages.length <= INITIAL_MESSAGE_WINDOW) return 0;
    return messages.length - INITIAL_MESSAGE_WINDOW;
  }, [messages.length, renderAll]);

  const visibleSlice = useMemo(() => {
    if (renderAll || messages.length <= INITIAL_MESSAGE_WINDOW) {
      return messages;
    }
    return messages.slice(-INITIAL_MESSAGE_WINDOW);
  }, [messages, renderAll]);

  const showEarlier = useCallback(() => {
    setRenderAll(true);
  }, []);

  if (messages.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={showEarlier}
          className="mx-auto rounded-full border border-border/50 bg-card/80 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          +{hiddenCount} pesan sebelumnya
        </button>
      ) : null}

      {visibleSlice.map((message) => {
        const isStreaming = message.id === streamingMessageId;
        const isEmptyStreaming = isStreaming && message.content.length === 0;

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
            onRegenerate={onRegenerate}
            onEdit={onEdit}
            onCancelEdit={onCancelEdit}
            onSubmitEdit={onSubmitEdit}
            onOpenWorkflowPanel={onOpenWorkflowPanel}
            onOpenWorksheetPanel={onOpenWorksheetPanel}
          />
        );
      })}
    </>
  );
}