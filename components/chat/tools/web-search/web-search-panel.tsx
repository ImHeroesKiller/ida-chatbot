"use client";

import { Globe, Loader2, PanelRightClose, SearchX } from "lucide-react";

import { WebSearchResultItem } from "@/components/chat/tools/web-search/web-search-result-item";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { IdaWebSearchSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WebSearchPanelProps {
  locale: Locale;
  isSearching: boolean;
  lastQuery: string | null;
  searchResults: IdaWebSearchSource[];
  error?: string | null;
  onClose: () => void;
  onUseAsContext?: (result: IdaWebSearchSource) => void;
  onClearResults?: () => void;
  className?: string;
  embedded?: boolean;
}

export function WebSearchPanel({
  locale,
  isSearching,
  lastQuery,
  searchResults,
  error = null,
  onClose,
  onUseAsContext,
  onClearResults,
  className,
  embedded = false,
}: WebSearchPanelProps) {
  const copy = COPY[locale];
  const hasResults = searchResults.length > 0;
  const showEmpty = !isSearching && !hasResults && !error;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        embedded ? "w-full border-0" : "relative z-10 w-[min(100%,22rem)] shrink-0 border-l",
        className,
      )}
      aria-label={copy.webSearchPanelTitle}
      role="complementary"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Globe className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">
            {copy.webSearchPanelTitle}
          </h2>
          {lastQuery ? (
            <p className="truncate text-[10px] text-muted-foreground">
              {copy.webSearchPanelLastQuery.replace("{query}", lastQuery)}
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
            {copy.webSearchPanelClear}
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

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {isSearching ? (
            <div
              className="flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-8 text-center"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground/90">
                  {copy.webSearchPanelSearching}
                </p>
                {lastQuery ? (
                  <p className="max-w-xs text-xs text-muted-foreground">
                    “{lastQuery}”
                  </p>
                ) : null}
              </div>
              <div className="w-full max-w-xs space-y-2">
                <div className="h-2.5 animate-pulse rounded-full bg-primary/10" />
                <div className="h-2.5 w-[85%] animate-pulse rounded-full bg-primary/10" />
                <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ) : null}

          {error && !isSearching ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-6 text-center">
              <SearchX className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {copy.webSearchPanelError}
              </p>
              <p className="text-xs leading-relaxed text-destructive/80">
                {error}
              </p>
            </div>
          ) : null}

          {showEmpty ? (
            <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/15 px-4 py-8 text-center">
              <Globe className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground/90">
                {copy.webSearchPanelEmptyTitle}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                {copy.webSearchPanelEmpty}
              </p>
            </div>
          ) : null}

          {hasResults && !isSearching
            ? searchResults.map((result, index) => (
                <WebSearchResultItem
                  key={`${result.url}-${index}`}
                  locale={locale}
                  result={result}
                  index={index}
                  onUseAsContext={onUseAsContext}
                />
              ))
            : null}
        </div>
      </ScrollArea>
    </aside>
  );
}