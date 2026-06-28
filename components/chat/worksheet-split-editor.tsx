"use client";

import { Columns2, FileCode2, PenLine } from "lucide-react";
import { useRef, type RefObject } from "react";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { WorksheetEditorToolbar } from "@/components/chat/worksheet-editor-toolbar";
import { WorksheetWysiwygEditor } from "@/components/chat/worksheet-wysiwyg-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type WorksheetEditLayout = "visual" | "markdown" | "split";

interface WorksheetSplitEditorProps {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  layout: WorksheetEditLayout;
  onLayoutChange: (layout: WorksheetEditLayout) => void;
  embedded?: boolean;
}

export function WorksheetSplitEditor({
  locale,
  value,
  onChange,
  layout,
  onLayoutChange,
  embedded = false,
}: WorksheetSplitEditorProps) {
  const copy = COPY[locale];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const layoutButtonClass = "h-7 gap-1.5 px-2.5 text-[11px]";

  const layoutHint =
    layout === "visual"
      ? copy.worksheetEditVisualHint
      : layout === "split"
        ? copy.worksheetEditSplitHint
        : copy.worksheetEditMarkdownHint;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-muted/20 p-0.5">
          <Button
            type="button"
            variant={layout === "visual" ? "default" : "ghost"}
            size="sm"
            className={layoutButtonClass}
            onClick={() => onLayoutChange("visual")}
          >
            <PenLine className="h-3.5 w-3.5" />
            {copy.worksheetEditVisual}
          </Button>
          <Button
            type="button"
            variant={layout === "markdown" ? "default" : "ghost"}
            size="sm"
            className={layoutButtonClass}
            onClick={() => onLayoutChange("markdown")}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            {copy.worksheetEditMarkdown}
          </Button>
          <Button
            type="button"
            variant={layout === "split" ? "default" : "ghost"}
            size="sm"
            className={layoutButtonClass}
            onClick={() => onLayoutChange("split")}
          >
            <Columns2 className="h-3.5 w-3.5" />
            {copy.worksheetEditSplit}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">{layoutHint}</p>
      </div>

      {layout === "visual" ? (
        <WorksheetWysiwygEditor
          locale={locale}
          value={value}
          onChange={onChange}
        />
      ) : (
        <>
          <WorksheetEditorToolbar
            locale={locale}
            textareaRef={textareaRef as RefObject<HTMLTextAreaElement | null>}
            value={value}
            onChange={onChange}
          />

          {layout === "markdown" ? (
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="min-h-[min(60vh,28rem)] font-mono text-sm leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <div
              className={cn(
                "grid min-h-[min(60vh,28rem)] gap-2",
                embedded ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
              )}
            >
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-[min(40vh,20rem)] font-mono text-sm leading-relaxed lg:min-h-[min(60vh,28rem)]"
                spellCheck={false}
              />
              <ScrollArea className="min-h-[min(40vh,20rem)] rounded-xl border bg-card lg:min-h-[min(60vh,28rem)]">
                <div className="p-3">
                  <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                    {copy.previewLabel}
                  </p>
                  {value.trim() ? (
                    <MarkdownContent
                      locale={locale}
                      content={value}
                      className="chat-text text-sm"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {copy.worksheetEditPreviewEmpty}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </>
      )}
    </div>
  );
}