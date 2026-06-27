"use client";

import { IdaLogo } from "@/components/brand/ida-logo";
import { cn } from "@/lib/utils";

interface MessageSkeletonProps {
  className?: string;
}

export function MessageSkeleton({ className }: MessageSkeletonProps) {
  return (
    <div
      className={cn("flex w-full items-start gap-3", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading message"
    >
      <IdaLogo size="md" variant="avatar" className="opacity-70" aria-hidden />

      <div className="min-w-0 max-w-[min(85%,32rem)] flex-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3.5 shadow-sm">
        <div className="space-y-2.5">
          <div className="h-3 w-[92%] animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-[78%] animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-[55%] animate-pulse rounded-full bg-muted/80" />
        </div>
      </div>
    </div>
  );
}