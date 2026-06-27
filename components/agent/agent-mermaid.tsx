"use client";

interface AgentMermaidProps {
  diagram: string;
  title?: string;
}

export function AgentMermaid({ diagram, title }: AgentMermaidProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-muted/30">
      {title && (
        <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/90 sm:text-xs">
        <code>{diagram}</code>
      </pre>
    </div>
  );
}