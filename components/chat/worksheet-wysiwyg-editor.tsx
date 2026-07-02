"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import type { WorksheetTiptapVariant } from "@/components/chat/worksheet-tiptap-editor";

const WorksheetTiptapEditor = dynamic(
  () =>
    import("@/components/chat/worksheet-tiptap-editor").then((mod) => ({
      default: mod.WorksheetTiptapEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed bg-muted/20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export type WorksheetWysiwygVariant = WorksheetTiptapVariant;

interface WorksheetWysiwygEditorProps {
  locale: import("@/lib/config").Locale;
  value: string;
  onChange: (value: string) => void;
  variant?: WorksheetWysiwygVariant;
  toolbarSticky?: boolean;
  showToolbar?: boolean;
  className?: string;
}

/** Visual WYSIWYG editor backed by TipTap; persists content as Markdown. */
export function WorksheetWysiwygEditor(props: WorksheetWysiwygEditorProps) {
  return <WorksheetTiptapEditor {...props} />;
}