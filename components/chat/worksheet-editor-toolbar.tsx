"use client";

import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Table,
} from "lucide-react";
import { useCallback, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  insertMarkdownLink,
  insertMarkdownPrefix,
  insertMarkdownSnippet,
  wrapMarkdownSelection,
  type TextEditResult,
  type TextSelectionRange,
} from "@/lib/worksheet-editor";
import { cn } from "@/lib/utils";

interface WorksheetEditorToolbarProps {
  locale: Locale;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function getSelection(textarea: HTMLTextAreaElement): TextSelectionRange {
  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
  };
}

export function WorksheetEditorToolbar({
  locale,
  textareaRef,
  value,
  onChange,
  className,
}: WorksheetEditorToolbarProps) {
  const copy = COPY[locale];

  const applyEdit = useCallback(
    (result: TextEditResult) => {
      onChange(result.value);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(
          result.selection.start,
          result.selection.end,
        );
      });
    },
    [onChange, textareaRef],
  );

  const runEdit = useCallback(
    (edit: (value: string, selection: TextSelectionRange) => TextEditResult) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      applyEdit(edit(value, getSelection(textarea)));
    },
    [applyEdit, textareaRef, value],
  );

  const toolbarButtonClass =
    "h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 rounded-lg border bg-muted/30 p-1",
        className,
      )}
      role="toolbar"
      aria-label={copy.worksheetEditorToolbar}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorBold}
        aria-label={copy.worksheetEditorBold}
        onClick={() =>
          runEdit((current, selection) =>
            wrapMarkdownSelection(current, selection, "**", "**"),
          )
        }
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorItalic}
        aria-label={copy.worksheetEditorItalic}
        onClick={() =>
          runEdit((current, selection) =>
            wrapMarkdownSelection(current, selection, "*", "*"),
          )
        }
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorHeading2}
        aria-label={copy.worksheetEditorHeading2}
        onClick={() =>
          runEdit((current, selection) =>
            insertMarkdownPrefix(current, selection, "## "),
          )
        }
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorHeading3}
        aria-label={copy.worksheetEditorHeading3}
        onClick={() =>
          runEdit((current, selection) =>
            insertMarkdownPrefix(current, selection, "### "),
          )
        }
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorBulletList}
        aria-label={copy.worksheetEditorBulletList}
        onClick={() =>
          runEdit((current, selection) =>
            insertMarkdownPrefix(current, selection, "- "),
          )
        }
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorNumberedList}
        aria-label={copy.worksheetEditorNumberedList}
        onClick={() =>
          runEdit((current, selection) =>
            insertMarkdownSnippet(
              current,
              selection,
              "1. First item\n2. Second item\n",
            ),
          )
        }
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorLink}
        aria-label={copy.worksheetEditorLink}
        onClick={() =>
          runEdit((current, selection) => insertMarkdownLink(current, selection))
        }
      >
        <Link className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorCode}
        aria-label={copy.worksheetEditorCode}
        onClick={() =>
          runEdit((current, selection) =>
            wrapMarkdownSelection(current, selection, "`", "`", "code"),
          )
        }
      >
        <Code className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorTable}
        aria-label={copy.worksheetEditorTable}
        onClick={() =>
          runEdit((current, selection) =>
            insertMarkdownSnippet(
              current,
              selection,
              "| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |\n",
            ),
          )
        }
      >
        <Table className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}