"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
} from "react";

import { WorksheetWysiwygToolbar } from "@/components/chat/worksheet-wysiwyg-toolbar";
import type { Locale } from "@/lib/config";
import {
  WORKSHEET_PANEL_PROSE_CLASS,
  WORKSHEET_PRINT_PROSE_CLASS,
} from "@/lib/worksheet-editor-styles";
import { COPY } from "@/lib/i18n";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from "@/lib/worksheet-markdown-convert";
import { cn } from "@/lib/utils";

export type WorksheetWysiwygVariant = "default" | "print";

interface WorksheetWysiwygEditorProps {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  variant?: WorksheetWysiwygVariant;
  toolbarSticky?: boolean;
  className?: string;
}

export function WorksheetWysiwygEditor({
  locale,
  value,
  onChange,
  variant = "default",
  toolbarSticky = false,
  className,
}: WorksheetWysiwygEditorProps) {
  const copy = COPY[locale];
  const editorRef = useRef<HTMLDivElement>(null);
  const lastMarkdownRef = useRef(value);
  const skipSyncRef = useRef(false);
  const mountedRef = useRef(false);

  const proseClass =
    variant === "print" ? WORKSHEET_PRINT_PROSE_CLASS : WORKSHEET_PANEL_PROSE_CLASS;

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
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          toolbarSticky &&
            "sticky top-0 z-10 rounded-lg border border-[#ddd] bg-white/95 p-1 backdrop-blur",
        )}
      >
        <WorksheetWysiwygToolbar
          locale={locale}
          editorRef={editorRef}
          onCommand={emitMarkdown}
          className={variant === "print" ? "border-[#ddd] bg-[#fafafa]" : undefined}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label={
          variant === "print"
            ? copy.worksheetFullViewEditorLabel
            : copy.worksheetEditVisual
        }
        data-placeholder={
          variant === "print"
            ? copy.worksheetFullViewPlaceholder
            : copy.worksheetEditVisualPlaceholder
        }
        className={proseClass}
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
      />
    </div>
  );
}