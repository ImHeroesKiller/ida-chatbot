"use client";

import { cn } from "@/lib/utils";

import type { EnterpriseView } from "./types";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted/60",
        className,
      )}
    />
  );
}

function HeaderSkeleton() {
  return (
    <div className="mb-8 space-y-3">
      <Bone className="h-3 w-24" />
      <Bone className="h-8 w-64 max-w-full" />
      <Bone className="h-4 w-96 max-w-full" />
    </div>
  );
}

function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="enterprise-card-premium rounded-2xl p-7">
          <Bone className="mb-3 h-5 w-40" />
          <Bone className="mb-2 h-3 w-full" />
          <Bone className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function BriefSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="enterprise-card-premium rounded-2xl p-7">
            <div className="mb-4 flex items-center gap-3">
              <Bone className="size-9 rounded-xl" />
              <Bone className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              <Bone className="h-16 w-full rounded-xl" />
              <Bone className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="enterprise-card-premium rounded-2xl p-7">
        <Bone className="mb-6 h-6 w-48" />
        <Bone className="h-[380px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="enterprise-card-premium rounded-2xl p-7">
            <Bone className="mb-2 h-5 w-56" />
            <Bone className="h-3 w-full" />
            <Bone className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MemorySkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <CardGridSkeleton count={4} />
    </div>
  );
}

type ViewSkeletonProps = {
  view: EnterpriseView;
};

export function ViewSkeleton({ view }: ViewSkeletonProps) {
  switch (view) {
    case "import":
    case "why-ida":
    case "roadmap":
    case "executive-brief":
      return <BriefSkeleton />;
    case "organization":
      return <MapSkeleton />;
    case "memory":
      return <MemorySkeleton />;
    case "timeline":
      return <ListSkeleton />;
    default:
      return (
        <div>
          <HeaderSkeleton />
          <CardGridSkeleton />
        </div>
      );
  }
}