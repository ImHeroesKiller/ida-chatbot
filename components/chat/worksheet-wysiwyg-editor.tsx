"use client";

import {
  WorksheetTiptapEditor,
  type WorksheetTiptapVariant,
} from "@/components/chat/worksheet-tiptap-editor";

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