"use client";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import type { OrganizationNode } from "@/components/enterprise/types";
import { cn } from "@/lib/utils";

type MapNode = OrganizationNode & {
  position: string;
  accent: string;
  compact?: boolean;
};

type LivingOrganizationMapProps = {
  nodes: MapNode[];
  selectedNodeId: string;
  onSelectNode: (node: OrganizationNode) => void;
  onReset: () => void;
};

const positionClass: Record<string, string> = {
  center:
    "left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 px-6 py-5 sm:px-8 sm:py-6",
  "left-top": "left-[8%] top-[10%] sm:left-[12%]",
  "right-top": "right-[8%] top-[10%] sm:right-[12%]",
  bottom: "bottom-[10%] left-1/2 -translate-x-1/2",
  "left-mid": "left-0 top-1/2 -translate-y-1/2 sm:left-[2%]",
  "right-mid": "right-0 top-1/2 -translate-y-1/2 sm:right-[2%]",
  "bottom-left": "bottom-[12%] left-[18%] sm:left-[24%]",
};

export function LivingOrganizationMap({
  nodes,
  selectedNodeId,
  onSelectNode,
  onReset,
}: LivingOrganizationMapProps) {
  return (
    <EnterpriseGlassCard padding="lg" className="flex h-full min-h-0 flex-col">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Living Organization
          </h2>
          <p className="text-sm text-muted-foreground">
            One system. Many connections.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-full border border-border/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground sm:self-auto"
        >
          Reset View
        </button>
      </div>

      <div className="relative min-h-[320px] flex-1 sm:min-h-[380px] lg:min-h-[420px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-6 rounded-3xl border border-dashed border-border/30 bg-muted/20"
        />

        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const isCenter = node.position === "center";

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node)}
              className={cn(
                "ida-glass-subtle absolute cursor-pointer rounded-2xl border bg-background/90 text-center shadow-sm transition-all hover:scale-[1.03] hover:shadow-md",
                positionClass[node.position],
                node.accent,
                node.compact ? "px-4 py-2.5 text-sm" : "px-5 py-4",
                isCenter && "border-2 shadow-lg",
                isSelected && "ring-2 ring-primary/25",
              )}
            >
              <div className={cn("font-medium", isCenter && "text-lg sm:text-xl")}>
                {node.name}
              </div>
              <div className="mt-0.5 text-xs opacity-75">
                {node.role}
                {node.health && !node.compact ? ` • ${node.health}` : ""}
              </div>
            </button>
          );
        })}
      </div>
    </EnterpriseGlassCard>
  );
}