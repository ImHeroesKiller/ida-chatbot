"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
} from "react";

import { WorksheetWysiwygToolbar } from "@/components/chat/worksheet-wysiwyg-toolbar";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from "@/lib/worksheet-markdown-convert";
import { cn } from "@/lib/utils";

const WORKSHEET_PROSE_CLASS = cn(
  "ida-markdown min-h-[min(60vh,28rem)] rounded-xl border bg-card p-3 text-sm leading-relaxed outline-none",
  "focus-visible:ring-3 focus-visible:ring-ring/50",
  "[&_p]:mb-2 [&_p:last-child]:mb-0",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
  "[&_li]:leading-relaxed",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
  "[&_strong]:font-semibold",
  "[&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold",
  "[&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold",
  "[&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium",
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
  "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
  "empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
);

interface WorksheetWysiwygEditorProps {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
}

export function WorksheetWysiwygEditor({
  locale,
  value,
  onChange,
}: WorksheetWysiwygEditorProps) {
  const copy = COPY[locale];
  const editorRef = useRef<HTMLDivElement>(null);
  const lastMarkdownRef = useRef(value);
  const skipSyncRef = useRef(false);
  const mountedRef = useRef(false);

  const emitMarkdown = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const markdown = editorHtmlToMarkdown(editor.innerHTML);
    skipSyncRef.current = true;
    lastMarkdownRef.current = markdown;
    onChange(markdown);
  }, [onChange]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!mountedRef.current) {
      editor.innerHTML = markdownToEditorHtml(value);
      lastMarkdownRef.current = value;
      mountedRef.current = true;
      return;
    }

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    if (value === lastMarkdownRef.current) return;

    editor.innerHTML = markdownToEditorHtml(value);
    lastMarkdownRef.current = value;
  }, [value]);

  const handleInput = useCallback(() => {
    emitMarkdown();
  }, [emitMarkdown]);

  const handleBlur = useCallback(() => {
    emitMarkdown();
  }, [emitMarkdown]);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      if (!text) return;
      document.execCommand("insertText", false, text);
      emitMarkdown();
    },
    [emitMarkdown],
  );

  return (
    <div className="space-y-2">
      <WorksheetWysiwygToolbar
        locale={locale}
        editorRef={editorRef}
        onCommand={emitMarkdown}
      />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label={copy.worksheetEditVisual}
        data-placeholder={copy.worksheetEditVisualPlaceholder}
        className={WORKSHEET_PROSE_CLASS}
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
      />
    </div>
  );
}