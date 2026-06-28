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
          expanded ? "mx-1 h-10" : "mx-auto size-9",
        )}
      />
      <div className="h-9 animate-pulse rounded-lg bg-muted" />
      {expanded && (
        <div className="h-8 animate-pulse rounded-lg bg-muted/80" />
      )}
      {expanded ? (
        <div className="mt-1 flex-1 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-muted/70"
            />
          ))}
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <div
        className={cn(
          "mt-auto animate-pulse rounded-lg bg-muted/60",
          expanded ? "h-20" : "h-11",
        )}
      />
    </div>
  );
}