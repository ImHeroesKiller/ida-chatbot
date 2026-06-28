"use client";

import { Copy, Download, FileText, Loader2, PanelRightClose } from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { sanitizeWorksheetFilename } from "@/lib/worksheet";
import { cn } from "@/lib/utils";

interface WorksheetPanelProps {
  locale: Locale;
  title: string;
  content: string;
  isGenerating?: boolean;
  onTitleChange: (title: string) => void;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

export function WorksheetPanel({
  locale,
  title,
  content,
  isGenerating = false,
  onTitleChange,
  onClose,
  className,
  embedded = false,
}: WorksheetPanelProps) {
  const copy = COPY[locale];
  const [copied, setCopied] = useState(false);

  const hasContent = Boolean(content.trim());

  const handleCopy = useCallback(async () => {
    if (!hasContent) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(copy.worksheetCopied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy.errors.generic);
    }
  }, [content, copy.errors.generic, copy.worksheetCopied, hasContent]);

  const handleDownload = useCallback(() => {
    if (!hasContent) return;

    const filename = `${sanitizeWorksheetFilename(title)}.md`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(copy.worksheetDownloaded);
  }, [content, copy.worksheetDownloaded, hasContent, title]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-muted/10 dark:bg-muted/5",
        embedded ? "w-full" : "w-[min(100%,24rem)] shrink-0",
        className,
      )}
      aria-label={copy.toolsWorksheet}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {copy.toolsWorksheet}
        </h2>
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

      <div className="shrink-0 space-y-2 border-b px-3 py-3">
        <label className="text-[11px] font-medium text-muted-foreground">
          {copy.worksheetTitleLabel}
        </label>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={copy.worksheetTitlePlaceholder}
          className="h-9 text-sm"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {isGenerating ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center dark:bg-background/40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {copy.worksheetGenerating}
              </p>
            </div>
          ) : hasContent ? (
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <MarkdownContent
                locale={locale}
                content={content}
                className="chat-text text-sm"
              />
            </div>
          ) : (
            <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center dark:bg-background/40">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground/90">
                {copy.worksheetEmptyTitle}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {copy.worksheetEmptyHint}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex shrink-0 gap-2 border-t bg-muted/10 p-3 dark:bg-muted/5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 gap-1.5 text-xs"
          disabled={!hasContent}
          onClick={() => void handleCopy()}
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? copy.worksheetCopied : copy.worksheetCopy}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 gap-1.5 text-xs"
          disabled={!hasContent}
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" />
          {copy.worksheetDownload}
        </Button>
      </div>
    </aside>
  );
}