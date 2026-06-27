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
      <div className="h-9 animate-pulse rounded-lg bg-muted" />
      {expanded && (
        <div className="h-8 animate-pulse rounded-lg bg-muted/80" />
      )}
      <div className="mt-1 flex-1 space-y-2">
        {Array.from({ length: expanded ? 5 : 3 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "animate-pulse rounded-xl bg-muted/70",
              expanded ? "h-12" : "mx-auto h-9 w-9",
            )}
          />
        ))}
      </div>
      <div className="mt-auto h-20 animate-pulse rounded-lg bg-muted/60" />
    </div>
  );
}