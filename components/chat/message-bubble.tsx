"use client";

import { motion } from "framer-motion";
import { ExternalLink, MapPin, Search } from "lucide-react";

import { fadeUp } from "@/lib/ui/motion-presets";

import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { ChatToolResultCard } from "@/components/chat/chat-tool-result-card";
import { MediaGenResultCard } from "@/components/chat/media-gen-result-card";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { MessageEditForm } from "@/components/chat/message-edit-form";
import { WebSearchSources } from "@/components/chat/web-search-sources";
import { MessageActions } from "@/components/chat/message-actions";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { haversineDistanceKm, estimateTravelTimeMin } from "@/lib/map-types";
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
  onOpenWorkflowPanel?: () => void;
  onOpenWorksheetPanel?: () => void;
  /** Click handlers for result cards in chat: open the corresponding tool modal (no direct from menu toggle for web/map/research). */
  onOpenWebSearchPanel?: () => void;
  onOpenResearchPanel?: () => void;
  onOpenMapPanel?: () => void;
  onOpenImageGenPanel?: () => void;
  onOpenVideoGenPanel?: () => void;
  onOpenMusicGenPanel?: () => void;
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
  onOpenWorkflowPanel,
  onOpenWorksheetPanel,
  onOpenWebSearchPanel,
  onOpenResearchPanel,
  onOpenMapPanel,
  onOpenImageGenPanel,
  onOpenVideoGenPanel,
  onOpenMusicGenPanel,
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
        ...fadeUp.initial,
        x: isUser ? 12 : -12,
      }}
      animate={{ ...fadeUp.animate, x: 0 }}
      transition={fadeUp.transition}
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
              "max-w-full px-3.5 py-3 transition-all duration-300 sm:px-4 sm:py-3 lg:px-4 lg:py-3",
              isUser
                ? "rounded-[22px] rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/15 ring-1 ring-primary/20 lg:shadow-lg lg:shadow-primary/20"
                : "rounded-[22px] rounded-bl-md border border-border/40 text-foreground shadow-sm lg:ida-glass-subtle lg:shadow-md",
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
              onOpenPanel={onOpenWebSearchPanel}
            />
          </div>
        ) : null}

        {/* Research summary card (click to open Research modal/panel). Only from chat card, not menu toggle. */}
        {!isUser && !isEditing && message.researchSummary ? (
          <button
            type="button"
            onClick={onOpenResearchPanel}
            disabled={!onOpenResearchPanel}
            className={cn(
              "mt-1.5 w-full rounded-xl border bg-card/80 p-3 text-left shadow-sm transition-colors",
              onOpenResearchPanel
                ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
                : "cursor-default",
            )}
            aria-label={`Buka research: ${message.researchSummary.slice(0, 60)}`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">
                <Search className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Research Summary
                </p>
                <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-foreground/90">
                  {message.researchSummary}
                </p>
                {message.researchSources?.length ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {message.researchSources.length} sources · Klik untuk buka panel
                  </p>
                ) : null}
              </div>
              {onOpenResearchPanel ? (
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : null}
            </div>
          </button>
        ) : null}

        {/* Map location cards in chat (click opens Map modal). Supports multiple points + auto dist/time calc. */}
        {!isUser && !isEditing && message.mapLocations && message.mapLocations.length > 0 ? (
          <button
            type="button"
            onClick={onOpenMapPanel}
            disabled={!onOpenMapPanel}
            className={cn(
              "mt-1.5 w-full rounded-xl border bg-card/80 p-3 text-left shadow-sm transition-colors",
              onOpenMapPanel
                ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
                : "cursor-default",
            )}
            aria-label="Buka peta dengan lokasi ini"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Map Locations
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {message.mapLocations.slice(0, 4).map((loc, idx) => (
                    <span
                      key={loc.id || idx}
                      className="inline-block max-w-[11rem] truncate rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/90"
                    >
                      {loc.label || "Point"} · {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </span>
                  ))}
                  {message.mapLocations.length > 4 ? (
                    <span className="text-[10px] text-muted-foreground self-center">+{message.mapLocations.length - 4}</span>
                  ) : null}
                </div>
                {message.mapLocations.length >= 2 ? (() => {
                  const a = message.mapLocations[0];
                  const b = message.mapLocations[1];
                  const d = haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);
                  const t = estimateTravelTimeMin(d);
                  return (
                    <p className="mt-1.5 text-[10px] font-medium text-primary/80">
                      Jarak: {d.toFixed(1)} km • Est. {t} menit (drive)
                    </p>
                  );
                })() : null}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Klik card untuk buka modal peta
                </p>
              </div>
              {onOpenMapPanel ? (
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : null}
            </div>
            {onOpenMapPanel ? (
              <div className="mt-2 flex gap-2">
                <span className="inline-flex h-7 items-center rounded-md border border-primary/30 bg-primary/5 px-2.5 text-[10px] font-medium text-primary">
                  Buka peta
                </span>
              </div>
            ) : null}
          </button>
        ) : null}

        {!isUser &&
        !isEditing &&
        (message.imageGenResult ||
          message.videoGenResult ||
          message.musicGenResult) ? (
          <MediaGenResultCard
            locale={locale}
            imageResult={message.imageGenResult}
            videoResult={message.videoGenResult}
            musicResult={message.musicGenResult}
            onOpenImageGenPanel={onOpenImageGenPanel}
            onOpenVideoGenPanel={onOpenVideoGenPanel}
            onOpenMusicGenPanel={onOpenMusicGenPanel}
          />
        ) : null}

        {!isUser &&
        !isEditing &&
        (message.workflowResult || message.worksheetResult) ? (
          <div className="mt-1.5 w-full">
            <ChatToolResultCard
              locale={locale}
              workflowResult={message.workflowResult}
              worksheetResult={message.worksheetResult}
              onOpenWorkflow={onOpenWorkflowPanel}
              onOpenWorksheet={onOpenWorksheetPanel}
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
            <div className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100">
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