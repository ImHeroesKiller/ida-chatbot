"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Table,
  Undo2,
} from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WorksheetTiptapToolbarProps {
  locale: Locale;
  editor: Editor | null;
  className?: string;
}

export function WorksheetTiptapToolbar({
  locale,
  editor,
  className,
}: WorksheetTiptapToolbarProps) {
  const copy = COPY[locale];

  const run = useCallback(
    (action: () => void) => {
      if (!editor) return;
      action();
    },
    [editor],
  );

  const toolbarButtonClass =
    "h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground";

  const activeClass = (active: boolean) =>
    active ? "bg-primary/10 text-primary" : undefined;

  if (!editor) {
    return (
      <div
        className={cn(
          "flex h-10 items-center rounded-lg border bg-muted/30 p-1",
          className,
        )}
        aria-hidden
      />
    );
  }

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
        title={copy.worksheetEditorUndo}
        aria-label={copy.worksheetEditorUndo}
        disabled={!editor.can().undo()}
        onClick={() => run(() => editor.chain().focus().undo().run())}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={toolbarButtonClass}
        title={copy.worksheetEditorRedo}
        aria-label={copy.worksheetEditorRedo}
        disabled={!editor.can().redo()}
        onClick={() => run(() => editor.chain().focus().redo().run())}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("bold")),
        )}
        title={copy.worksheetEditorBold}
        aria-label={copy.worksheetEditorBold}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("italic")),
        )}
        title={copy.worksheetEditorItalic}
        aria-label={copy.worksheetEditorItalic}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("heading", { level: 1 })),
        )}
        title={copy.worksheetEditorHeading1}
        aria-label={copy.worksheetEditorHeading1}
        onClick={() =>
          run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())
        }
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("heading", { level: 2 })),
        )}
        title={copy.worksheetEditorHeading2}
        aria-label={copy.worksheetEditorHeading2}
        onClick={() =>
          run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())
        }
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("heading", { level: 3 })),
        )}
        title={copy.worksheetEditorHeading3}
        aria-label={copy.worksheetEditorHeading3}
        onClick={() =>
          run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())
        }
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Button>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("bulletList")),
        )}
        title={copy.worksheetEditorBulletList}
        aria-label={copy.worksheetEditorBulletList}
        onClick={() =>
          run(() => editor.chain().focus().toggleBulletList().run())
        }
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("orderedList")),
        )}
        title={copy.worksheetEditorNumberedList}
        aria-label={copy.worksheetEditorNumberedList}
        onClick={() =>
          run(() => editor.chain().focus().toggleOrderedList().run())
        }
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("blockquote")),
        )}
        title={copy.worksheetEditorBlockquote}
        aria-label={copy.worksheetEditorBlockquote}
        onClick={() =>
          run(() => editor.chain().focus().toggleBlockquote().run())
        }
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("code")),
        )}
        title={copy.worksheetEditorCode}
        aria-label={copy.worksheetEditorCode}
        onClick={() => run(() => editor.chain().focus().toggleCode().run())}
      >
        <Code className="h-3.5 w-3.5" />
      </Button>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive({ textAlign: "left" })),
        )}
        title={copy.worksheetEditorAlignLeft}
        aria-label={copy.worksheetEditorAlignLeft}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign("left").run())
        }
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive({ textAlign: "center" })),
        )}
        title={copy.worksheetEditorAlignCenter}
        aria-label={copy.worksheetEditorAlignCenter}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign("center").run())
        }
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive({ textAlign: "right" })),
        )}
        title={copy.worksheetEditorAlignRight}
        aria-label={copy.worksheetEditorAlignRight}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign("right").run())
        }
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive({ textAlign: "justify" })),
        )}
        title={copy.worksheetEditorAlignJustify}
        aria-label={copy.worksheetEditorAlignJustify}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign("justify").run())
        }
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </Button>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          toolbarButtonClass,
          activeClass(editor.isActive("link")),
        )}
        title={copy.worksheetEditorLink}
        aria-label={copy.worksheetEditorLink}
        onClick={() =>
          run(() => {
            const previous = editor.getAttributes("link").href as
              | string
              | undefined;
            const url = window.prompt(
              copy.worksheetEditorLinkPrompt,
              previous ?? "https://",
            );
            if (url === null) return;
            if (!url.trim()) {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url.trim() })
              .run();
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
        title={copy.worksheetEditorTable}
        aria-label={copy.worksheetEditorTable}
        onClick={() =>
          run(() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
          )
        }
      >
        <Table className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}