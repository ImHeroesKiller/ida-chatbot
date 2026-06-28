"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  isStreaming?: boolean;
  locale: Locale;
  className?: string;
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
    <div className="group/code relative my-2">
      <pre className="overflow-x-auto rounded-xl bg-muted p-3 pr-10">
        <code>{children}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <div className="group/copy relative">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label={copy.copyCode}
            className={cn(
              "h-7 w-7 rounded-md bg-background/80 text-muted-foreground backdrop-blur-sm",
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

export function MarkdownContent({
  content,
  isStreaming,
  locale,
  className,
}: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "ida-markdown",
        "[&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_li]:leading-relaxed",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
        "[&_pre]:my-0 [&_pre]:bg-transparent [&_pre]:p-0",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_strong]:font-semibold",
        "[&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold",
        "[&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold",
        "[&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium",
        "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <CodeBlock locale={locale}>{children}</CodeBlock>;
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