"use client";

import { MarkdownContent } from "@/components/chat/markdown-content";
import type { Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

interface SharedWorksheetViewProps {
  locale: Locale;
  title: string;
  content: string;
  className?: string;
}

export function SharedWorksheetView({
  locale,
  title,
  content,
  className,
}: SharedWorksheetViewProps) {
  return (
    <article className={cn("mx-auto max-w-3xl", className)}>
      <header className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </header>
      <MarkdownContent
        locale={locale}
        content={content}
        className="chat-text text-sm leading-relaxed"
      />
    </article>
  );
}