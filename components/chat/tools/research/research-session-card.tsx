"use client";

import { Clock, FileSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { ResearchSession } from "@/lib/research-types";
import { cn } from "@/lib/utils";

interface ResearchSessionCardProps {
  locale: Locale;
  session: ResearchSession;
  onOpen?: (session: ResearchSession) => void;
  onCreateDocument?: (session: ResearchSession) => void;
  className?: string;
}

function formatDate(timestamp: number, locale: Locale): string {
  return new Date(timestamp).toLocaleDateString(
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export function ResearchSessionCard({
  locale,
  session,
  onOpen,
  onCreateDocument,
  className,
}: ResearchSessionCardProps) {
  const copy = COPY[locale];

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary/20",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {session.topic}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium capitalize">
              {session.depth}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(session.savedAt || session.createdAt, locale)}
            </span>
            <span>
              {copy.researchPanelSourceCount.replace(
                "{count}",
                String(session.sources.length),
              )}
            </span>
          </div>
          {session.summary ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {session.summary.split("\n").find((line) => line.trim()) ??
                session.summary}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {onOpen ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-6 text-[10px]"
                onClick={() => onOpen(session)}
              >
                {copy.researchPanelOpenSession}
              </Button>
            ) : null}
            {onCreateDocument ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-6 text-[10px]"
                onClick={() => onCreateDocument(session)}
              >
                {copy.researchPanelCreateDocument}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}