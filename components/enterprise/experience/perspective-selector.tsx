"use client";

import { cn } from "@/lib/utils";

import { useEnterprise } from "./enterprise-context";
import type { PerspectiveId } from "./types";

const PERSPECTIVES: Array<{ id: PerspectiveId; label: string }> = [
  { id: "ceo", label: "CEO" },
  { id: "cfo", label: "CFO" },
  { id: "sales", label: "Sales" },
  { id: "project", label: "Project" },
  { id: "hr", label: "HR" },
];

type PerspectiveSelectorProps = {
  compact?: boolean;
  className?: string;
};

export function PerspectiveSelector({ compact = false, className }: PerspectiveSelectorProps) {
  const { perspective, setPerspective, workforceDemoRunning } = useEnterprise();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!compact ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Perspective
        </span>
      ) : null}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/40 bg-muted/20 p-1">
        {PERSPECTIVES.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={workforceDemoRunning}
            onClick={() => setPerspective(p.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              perspective === p.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              workforceDemoRunning && perspective !== p.id && "opacity-50",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}