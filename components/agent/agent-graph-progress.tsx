"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";

import { getGraphProgress } from "@/lib/agent/graph";
import type { AgentWorkflowRun } from "@/lib/agent/types";
import { cn } from "@/lib/utils";

interface AgentGraphProgressProps {
  run: AgentWorkflowRun;
  title: string;
}

export function AgentGraphProgress({ run, title }: AgentGraphProgressProps) {
  const progress = getGraphProgress(run);

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <ol className="space-y-2">
        {progress.map((item) => (
          <li
            key={item.node}
            className={cn(
              "flex items-center gap-2 text-xs",
              item.current && "font-medium text-primary",
              item.completed && !item.current && "text-muted-foreground",
            )}
          >
            {item.completed && !item.current ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-green-600" />
            ) : item.current ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted-foreground/40" />
            )}
            <span className="truncate">{item.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}