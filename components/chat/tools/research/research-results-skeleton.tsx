"use client";

import { cn } from "@/lib/utils";

interface ResearchResultsSkeletonProps {
  className?: string;
}

export function ResearchResultsSkeleton({
  className,
}: ResearchResultsSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <div className="space-y-2 rounded-xl border bg-card p-3.5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-full animate-pulse rounded bg-muted/80" />
        <div className="h-2.5 w-[92%] animate-pulse rounded bg-muted/80" />
        <div className="h-2.5 w-[78%] animate-pulse rounded bg-muted/60" />
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border bg-card p-3.5">
          <div className="flex gap-2">
            <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-primary/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-[70%] animate-pulse rounded bg-muted" />
              <div className="h-2 w-24 animate-pulse rounded bg-muted/70" />
              <div className="h-2.5 w-full animate-pulse rounded bg-muted/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}