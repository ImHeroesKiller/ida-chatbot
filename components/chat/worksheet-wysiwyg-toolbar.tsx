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
  Quote,
  Table,
} from "lucide-react";
import { useCallback, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WorksheetWysiwygToolbarProps {
  locale: Locale;
  editorRef: RefObject<HTMLDivElement | null>;
  onCommand: () => void;
  className?: string;
}

function focusEditor(editor: HTMLDivElement | null): void {
  if (!editor) return;
  editor.focus();
}

function runCommand(
  editor: HTMLDivElement | null,
  command: string,
  value?: string,
): void {
  focusEditor(editor);
  document.execCommand(command, false, value);
}

export function WorksheetWysiwygToolbar({
  locale,
  editorRef,
  onCommand,
  className,
}: WorksheetWysiwygToolbarProps) {
  const copy = COPY[locale];

  const handle = useCallback(
    (action: () => void) => {
      action();
      onCommand();
    },
    [onCommand],
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
          handle(() => runCommand(editorRef.current, "bold"))
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
          handle(() => runCommand(editorRef.current, "italic"))
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
          handle(() =>
            runCommand(editorRef.current, "formatBlock", "h2"),
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
          handle(() =>
            runCommand(editorRef.current, "formatBlock", "h3"),
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
          handle(() =>
            runCommand(editorRef.current, "insertUnorderedList"),
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
          handle(() =>
            runCommand(editorRef.current, "insertOrderedList"),
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
          handle(() => {
            const url = window.prompt(
              copy.worksheetEditorLinkPrompt,
              "https://",
            );
            if (!url?.trim()) return;
            runCommand(editorRef.current, "createLink", url.trim());
          })
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
          handle(() => {
            focusEditor(editorRef.current);
            const selection = window.getSelection();
            const text = selection?.toString() || "code";
            document.execCommand(
              "insertHTML",
              false,
              `<code>${text}</code>`,
            );
          })
        }
      >
        <Code className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorBlockquote}
        aria-label={copy.worksheetEditorBlockquote}
        onClick={() =>
          handle(() =>
            runCommand(editorRef.current, "formatBlock", "blockquote"),
          )
        }
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorTable}
        aria-label={copy.worksheetEditorTable}
        onClick={() =>
          handle(() => {
            focusEditor(editorRef.current);
            document.execCommand(
              "insertHTML",
              false,
              `<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value</td><td>Value</td></tr></tbody></table><p></p>`,
            );
          })
        }
      >
        <Table className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}