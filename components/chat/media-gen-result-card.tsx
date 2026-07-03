"use client";

import { ExternalLink, ImageIcon, Music, Video } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type {
  IdaImageGenResultCard,
  IdaMusicGenResultCard,
  IdaVideoGenResultCard,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface MediaGenResultCardProps {
  locale: Locale;
  imageResult?: IdaImageGenResultCard;
  videoResult?: IdaVideoGenResultCard;
  musicResult?: IdaMusicGenResultCard;
  onOpenImageGenPanel?: () => void;
  onOpenVideoGenPanel?: () => void;
  onOpenMusicGenPanel?: () => void;
  className?: string;
}

function aspectClass(ratio?: string): string {
  switch (ratio) {
    case "16:9":
      return "aspect-video";
    case "9:16":
      return "aspect-[9/16] max-h-[22rem]";
    default:
      return "aspect-square max-w-[18rem]";
  }
}

export function MediaGenResultCard({
  locale,
  imageResult,
  videoResult,
  musicResult,
  onOpenImageGenPanel,
  onOpenVideoGenPanel,
  onOpenMusicGenPanel,
  className,
}: MediaGenResultCardProps) {
  const copy = COPY[locale];

  if (imageResult) {
    return (
      <button
        type="button"
        onClick={onOpenImageGenPanel}
        disabled={!onOpenImageGenPanel}
        className={cn(
          "mt-1.5 w-full max-w-[20rem] rounded-xl border bg-card/80 p-2 text-left shadow-sm transition-colors",
          onOpenImageGenPanel
            ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
            : "cursor-default",
          className,
        )}
        aria-label={`${copy.toolsImageGen}: ${imageResult.prompt.slice(0, 60)}`}
      >
        <div className="flex items-center gap-2 px-1 pb-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.toolsImageGen}
          </p>
          {onOpenImageGenPanel ? (
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          ) : null}
        </div>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border bg-muted/20",
            aspectClass(imageResult.aspectRatio),
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- generated media URL */}
          <img
            src={imageResult.imageUrl}
            alt={imageResult.prompt}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-1.5 line-clamp-2 px-1 text-[10px] text-muted-foreground">
          {imageResult.prompt}
        </p>
      </button>
    );
  }

  if (videoResult) {
    return (
      <button
        type="button"
        onClick={onOpenVideoGenPanel}
        disabled={!onOpenVideoGenPanel}
        className={cn(
          "mt-1.5 w-full max-w-[22rem] rounded-xl border bg-card/80 p-2 text-left shadow-sm transition-colors",
          onOpenVideoGenPanel
            ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
            : "cursor-default",
          className,
        )}
        aria-label={`${copy.toolsVideoGen}: ${videoResult.prompt.slice(0, 60)}`}
      >
        <div className="flex items-center gap-2 px-1 pb-1.5">
          <Video className="h-3.5 w-3.5 text-primary" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.toolsVideoGen}
          </p>
          {onOpenVideoGenPanel ? (
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          ) : null}
        </div>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border bg-muted/20",
            aspectClass(videoResult.aspectRatio ?? "16:9"),
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- generated video thumbnail */}
          <img
            src={videoResult.thumbnailUrl}
            alt={videoResult.prompt}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-1.5 line-clamp-2 px-1 text-[10px] text-muted-foreground">
          {videoResult.prompt}
        </p>
      </button>
    );
  }

  if (musicResult) {
    return (
      <button
        type="button"
        onClick={onOpenMusicGenPanel}
        disabled={!onOpenMusicGenPanel}
        className={cn(
          "mt-1.5 w-full max-w-[20rem] rounded-xl border bg-card/80 p-3 text-left shadow-sm transition-colors",
          onOpenMusicGenPanel
            ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
            : "cursor-default",
          className,
        )}
        aria-label={`${copy.toolsMusicGen}: ${musicResult.prompt.slice(0, 60)}`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
            <Music className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.toolsMusicGen}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-foreground/90">
              {musicResult.prompt}
            </p>
            <audio
              controls
              src={musicResult.audioUrl}
              className="mt-2 h-8 w-full"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          {onOpenMusicGenPanel ? (
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : null}
        </div>
      </button>
    );
  }

  return null;
}