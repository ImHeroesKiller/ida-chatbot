"use client";

import { cn } from "@/lib/utils";

interface SidebarSkeletonProps {
  expanded?: boolean;
  className?: string;
}

export function SidebarSkeleton({
  expanded = true,
  className,
}: SidebarSkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col gap-2 p-2", className)}>
      <div
        className={cn(
          "shrink-0 rounded-xl bg-muted/80",
          expanded ? "mx-1 h-10" : "mx-auto size-11",
        )}
      />
      <div className="mx-2 h-px bg-border/60" />
      <div
        className={cn(
          "animate-pulse rounded-lg bg-muted",
          expanded ? "mx-1 h-9" : "mx-auto size-11",
        )}
      />
      <div className="mx-2 h-px bg-border/60" />
      {expanded ? (
        <>
          <div className="mx-1 h-8 animate-pulse rounded-lg bg-muted/80" />
          <div className="mt-1 flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-xl bg-muted/70"
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mx-auto size-11 animate-pulse rounded-lg bg-muted/70" />
      )}
      <div
        className={cn(
          "mt-auto animate-pulse rounded-lg bg-muted/60",
          expanded ? "mx-1 h-9" : "mx-auto size-11",
        )}
      />
    </div>
  );
}