"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  PanelRightClose,
  Save,
  Search,
  SearchX,
} from "lucide-react";

import { ResearchDepthSelector } from "@/components/chat/tools/research/research-depth-selector";
import { ResearchLoadingIndicator } from "@/components/chat/tools/research/research-loading-indicator";
import { ResearchResultItem } from "@/components/chat/tools/research/research-result-item";
import { ResearchResultsSkeleton } from "@/components/chat/tools/research/research-results-skeleton";
import { ResearchSessionCard } from "@/components/chat/tools/research/research-session-card";
import { ResearchSummaryView } from "@/components/chat/tools/research/research-summary-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  RESEARCH_PROGRESS_STAGES,
  type ResearchProgressStage,
} from "@/lib/research-format";
import type { ResearchDepth, ResearchSession } from "@/lib/research-types";
import type { ResearchResult } from "@/components/chat/tools/research/use-research";
import { cn } from "@/lib/utils";

interface ResearchPanelProps {
  locale: Locale;
  isResearching: boolean;
  researchResults: ResearchResult | null;
  researchSessions: ResearchSession[];
  error?: string | null;
  onClose: () => void;
  onStartResearch: (topic: string, depth: ResearchDepth) => void;
  onSaveSession?: () => void;
  onClearResults?: () => void;
  onOpenSession?: (session: ResearchSession) => void;
  onCreateDocument?: (session: ResearchSession) => void;
  onCreateDocumentFromCurrent?: () => void;
  className?: string;
  embedded?: boolean;
}

const STAGE_INTERVAL_MS = 2200;

export function ResearchPanel({
  locale,
  isResearching,
  researchResults,
  researchSessions,
  error = null,
  onClose,
  onStartResearch,
  onSaveSession,
  onClearResults,
  onOpenSession,
  onCreateDocument,
  onCreateDocumentFromCurrent,
  className,
  embedded = false,
}: ResearchPanelProps) {
  const copy = COPY[locale];
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>("standard");
  const [activeTopic, setActiveTopic] = useState("");
  const [progressStage, setProgressStage] =
    useState<ResearchProgressStage>("preparing");

  const hasResults = Boolean(researchResults?.sources.length);
  const showEmpty = !isResearching && !hasResults && !error;
  const stageIndex = RESEARCH_PROGRESS_STAGES.indexOf(progressStage);

  useEffect(() => {
    if (!isResearching) {
      setProgressStage("preparing");
      return;
    }

    setProgressStage("preparing");

    const interval = window.setInterval(() => {
      setProgressStage((current) => {
        const index = RESEARCH_PROGRESS_STAGES.indexOf(current);
        if (index < 0 || index >= RESEARCH_PROGRESS_STAGES.length - 1) {
          return current;
        }
        return RESEARCH_PROGRESS_STAGES[index + 1];
      });
    }, STAGE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isResearching]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || isResearching) return;
    setActiveTopic(trimmed);
    onStartResearch(trimmed, depth);
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-background",
        embedded ? "w-full" : "relative z-10 w-[min(100%,22rem)] shrink-0",
        className,
      )}
      aria-label={copy.researchPanelTitle}
      role="complementary"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">
            {copy.researchPanelTitle}
          </h2>
          {researchResults?.topic ? (
            <p className="truncate text-[10px] text-muted-foreground">
              {copy.researchPanelLastTopic.replace(
                "{topic}",
                researchResults.topic,
              )}
            </p>
          ) : null}
        </div>
        {hasResults && onClearResults ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 text-[10px]"
            onClick={onClearResults}
          >
            {copy.researchPanelClear}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.rightSidebarClose}
          title={copy.rightSidebarClose}
          className="h-8 w-8 shrink-0"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="shrink-0 border-b p-3">
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={copy.researchPanelTopicPlaceholder}
            disabled={isResearching}
            className="h-9 text-sm"
          />
          <ResearchDepthSelector
            locale={locale}
            value={depth}
            disabled={isResearching}
            onChange={setDepth}
          />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isResearching || !topic.trim()}
          >
            {isResearching ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                {copy.researchPanelSearching}
              </>
            ) : (
              copy.researchPanelStart
            )}
          </Button>
        </form>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {isResearching ? (
            <>
              <ResearchLoadingIndicator
                locale={locale}
                topic={activeTopic || topic}
                stage={progressStage}
                stageIndex={stageIndex}
                totalStages={RESEARCH_PROGRESS_STAGES.length}
              />
              <ResearchResultsSkeleton />
            </>
          ) : null}

          {error && !isResearching ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-6 text-center">
              <SearchX className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {copy.researchPanelError}
              </p>
              <p className="text-xs leading-relaxed text-destructive/80">
                {error}
              </p>
            </div>
          ) : null}

          {showEmpty ? (
            <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/15 px-4 py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground/90">
                {copy.researchPanelEmptyTitle}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                {copy.researchPanelEmpty}
              </p>
            </div>
          ) : null}

          {hasResults && researchResults && !isResearching ? (
            <>
              <ResearchSummaryView locale={locale} result={researchResults} />

              {researchResults.summary ? (
                <div className="rounded-xl border bg-card p-3.5 shadow-sm">
                  <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {copy.researchPanelSummary}
                  </p>
                  <pre className="chat-text max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                    {researchResults.summary}
                  </pre>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {onSaveSession ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-6 text-[10px]"
                        onClick={onSaveSession}
                      >
                        <Save className="mr-1 h-3 w-3" />
                        {copy.researchPanelSaveSession}
                      </Button>
                    ) : null}
                    {onCreateDocumentFromCurrent ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-6 text-[10px]"
                        onClick={onCreateDocumentFromCurrent}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {copy.researchPanelCreateDocument}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {researchResults.sources.map((source, index) => (
                <ResearchResultItem
                  key={`${source.url}-${index}`}
                  locale={locale}
                  result={source}
                  index={index}
                />
              ))}
            </>
          ) : null}

          {researchSessions.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {copy.researchPanelHistory}
              </p>
              {researchSessions.map((session) => (
                <ResearchSessionCard
                  key={session.id}
                  locale={locale}
                  session={session}
                  onOpen={onOpenSession}
                  onCreateDocument={onCreateDocument}
                />
              ))}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
}