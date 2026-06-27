"use client";

import { Sparkles } from "lucide-react";

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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
        <Sparkles className="h-4 w-4 text-primary/60" aria-hidden />
      </div>

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