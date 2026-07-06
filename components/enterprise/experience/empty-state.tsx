"use client";

import type { LucideIcon } from "lucide-react";
import { FileSearch, Inbox } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <EnterpriseGlassCard
      padding={compact ? "md" : "lg"}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </EnterpriseGlassCard>
  );
}

export function EmptyStateInline({
  title,
  description,
  className,
}: Pick<EmptyStateProps, "title" | "description" | "className">) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-border/50 px-6 py-10 text-center",
        className,
      )}
    >
      <FileSearch className="mb-3 size-5 text-muted-foreground/60" strokeWidth={1.5} />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}