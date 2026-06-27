"use client";

import { FileText, ImageIcon, X } from "lucide-react";
import Image from "next/image";

import type { IdaAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AttachmentPreviewProps {
  attachment: IdaAttachment;
  extractedLabel: string;
  removeLabel?: string;
  pendingHint?: string;
  onRemove?: () => void;
  compact?: boolean;
  className?: string;
}

export function AttachmentPreview({
  attachment,
  extractedLabel,
  removeLabel = "Remove attachment",
  pendingHint,
  onRemove,
  compact,
  className,
}: AttachmentPreviewProps) {
  const isImage = attachment.type === "image";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-muted/30",
        compact ? "text-left" : "",
        className,
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-background">
          {isImage && attachment.previewDataUrl ? (
            <Image
              src={attachment.previewDataUrl}
              alt={attachment.fileName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {isImage ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.fileName}</p>
          {attachment.summary ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {attachment.summary}
            </p>
          ) : pendingHint ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {pendingHint}
            </p>
          ) : null}
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={removeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!compact && attachment.extractedText && (
        <div className="border-t bg-background/60 px-3 py-2.5">
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
            {extractedLabel}
          </p>
          <p className="max-h-32 overflow-y-auto chat-text whitespace-pre-wrap text-muted-foreground">
            {attachment.extractedText}
          </p>
        </div>
      )}
    </div>
  );
}