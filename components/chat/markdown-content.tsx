"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { WORKSHEET_PRINT_PROSE_CLASS } from "@/lib/worksheet-print-typography";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean;
  locale: Locale;
  className?: string;
  variant?: "default" | "print";
}

function extractCodeText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map((child) => extractCodeText(child)).join("");
  }
  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    children.props
  ) {
    return extractCodeText(
      (children.props as { children?: ReactNode }).children,
    );
  }
  return "";
}

function CodeBlock({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const [copied, setCopied] = useState(false);
  const codeText = extractCodeText(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      toast.success(copy.copySuccess);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy.errors.generic);
    }
  };

  return (
    <div className="group/code relative my-3">
      <pre className="overflow-x-auto rounded-2xl border border-border/50 bg-muted/70 p-4 pr-12 text-[0.9em] leading-relaxed shadow-sm">
        <code className="font-mono text-foreground/90">{children}</code>
      </pre>
      <div className="absolute top-2.5 right-2.5">
        <div className="group/copy relative">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label={copy.copyCode}
            className={cn(
              "h-9 w-9 rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm sm:h-7 sm:w-7",
              "opacity-100 sm:opacity-0 sm:group-hover/code:opacity-100",
              "hover:bg-background hover:text-foreground",
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <span
            role="tooltip"
            className={cn(
              "pointer-events-none absolute bottom-full right-0 z-20 mb-1.5",
              "whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md",
              "opacity-0 transition-opacity duration-150",
              "group-hover/copy:opacity-100 group-focus-within/copy:opacity-100",
            )}
          >
            {copy.copyCode}
          </span>
        </div>
      </div>
    </div>
  );
}

function MarkdownTable({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-border/50 shadow-sm">
      <table className="w-full min-w-[20rem] border-collapse text-[0.92em]">
        {children}
      </table>
    </div>
  );
}

const CHAT_MARKDOWN_CLASS = cn(
  "ida-markdown chat-text",
  "[&_p]:mb-2.5 [&_p:last-child]:mb-0",
  "[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
  "[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
  "[&_li]:leading-relaxed [&_li]:pl-0.5",
  "[&_li>ul]:mt-1.5 [&_li>ol]:mt-1.5",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-primary/40 hover:[&_a]:decoration-primary",
  "[&_code]:rounded-md [&_code]:bg-muted/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-foreground/90",
  "[&_pre]:my-0 [&_pre]:bg-transparent [&_pre]:p-0",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_blockquote]:my-3 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/30 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:text-muted-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_hr]:my-4 [&_hr]:border-border/60",
  "[&_h1]:mb-2.5 [&_h1]:mt-4 [&_h1]:text-[1.15em] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground",
  "[&_h2]:mb-2 [&_h2]:mt-3.5 [&_h2]:text-[1.08em] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
  "[&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[1.02em] [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_h4]:mb-1 [&_h4]:mt-2.5 [&_h4]:text-[0.98em] [&_h4]:font-medium [&_h4]:text-foreground",
  "[&_th]:border-b [&_th]:border-border/60 [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[0.85em] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground",
  "[&_td]:border-b [&_td]:border-border/40 [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top",
  "[&_tr:last-child_td]:border-b-0",
  "[&_tbody_tr:hover]:bg-muted/20",
);

export function MarkdownContent({
  content,
  isStreaming,
  locale,
  className,
  variant = "default",
}: MarkdownContentProps) {
  const isPrint = variant === "print";

  return (
    <div
      className={cn(
        isPrint ? WORKSHEET_PRINT_PROSE_CLASS : CHAT_MARKDOWN_CLASS,
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            if (isPrint) {
              return <pre>{children}</pre>;
            }
            return <CodeBlock locale={locale}>{children}</CodeBlock>;
          },
          table({ children }) {
            if (isPrint) {
              return <table>{children}</table>;
            }
            return <MarkdownTable>{children}</MarkdownTable>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && content.length > 0 && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
      )}
    </div>
  );
}