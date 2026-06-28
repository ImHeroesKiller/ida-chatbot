"use client";

import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

import { WorksheetTiptapToolbar } from "@/components/chat/worksheet-tiptap-toolbar";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  WORKSHEET_PANEL_PROSE_CLASS,
  WORKSHEET_PRINT_PROSE_EDITOR_CLASS,
} from "@/lib/worksheet-editor-styles";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
  sanitizePastedEditorHtml,
} from "@/lib/worksheet-markdown-convert";
import { cn } from "@/lib/utils";

export type WorksheetTiptapVariant = "default" | "print";

interface WorksheetTiptapEditorProps {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  variant?: WorksheetTiptapVariant;
  toolbarSticky?: boolean;
  showToolbar?: boolean;
  className?: string;
}

function createExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}

export function WorksheetTiptapEditor({
  locale,
  value,
  onChange,
  variant = "default",
  toolbarSticky = false,
  showToolbar = true,
  className,
}: WorksheetTiptapEditorProps) {
  const copy = COPY[locale];
  const lastMarkdownRef = useRef(value);
  const skipSyncRef = useRef(false);

  const proseClass =
    variant === "print"
      ? WORKSHEET_PRINT_PROSE_EDITOR_CLASS
      : WORKSHEET_PANEL_PROSE_CLASS;

  const placeholder =
    variant === "print"
      ? copy.worksheetFullViewPlaceholder
      : copy.worksheetEditVisualPlaceholder;

  const editorLabel =
    variant === "print"
      ? copy.worksheetFullViewEditorLabel
      : copy.worksheetEditVisual;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions(),
    content: markdownToEditorHtml(value),
    editorProps: {
      attributes: {
        class: cn("worksheet-tiptap-editor outline-none", proseClass),
        "aria-label": editorLabel,
        "data-placeholder": placeholder,
      },
      transformPastedHTML(html) {
        const sanitized = sanitizePastedEditorHtml(html);
        return sanitized || html;
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const markdown = editorHtmlToMarkdown(activeEditor.getHTML());
      skipSyncRef.current = true;
      lastMarkdownRef.current = markdown;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor) return;

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    if (value === lastMarkdownRef.current) return;

    const html = markdownToEditorHtml(value);
    editor.commands.setContent(html, { emitUpdate: false });
    lastMarkdownRef.current = value;
  }, [editor, value]);

  useEffect(() => {
    lastMarkdownRef.current = value;
  }, [value]);

  return (
    <div
      className={cn(
        variant === "print" ? "space-y-3" : "space-y-2",
        className,
      )}
    >
      {showToolbar ? (
        <div
          className={cn(
            toolbarSticky &&
              "sticky top-0 z-10 -mx-1 rounded-md border border-[#e5e5e5] bg-white/98 p-1 shadow-sm backdrop-blur",
          )}
        >
          <WorksheetTiptapToolbar
            locale={locale}
            editor={editor}
            className={
              variant === "print"
                ? "border-0 bg-transparent shadow-none"
                : undefined
            }
          />
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}