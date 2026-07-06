"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspaceSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  highlight?: boolean;
};

export function WorkspaceSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  highlight = false,
}: WorkspaceSectionProps) {
  return (
    <section
      className={cn(
        highlight && "rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-violet-500/[0.03] p-5 sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}