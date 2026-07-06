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
    "left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 px-7 py-6 sm:px-9 sm:py-7",
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
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
            Relationship intelligence map
          </h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Built from organizational knowledge across accounts, initiatives, and functions.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-full border border-border/50 bg-background/50 px-5 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted/30 hover:text-foreground sm:self-auto"
        >
          Reset View
        </button>
      </div>

      <div className="relative min-h-[340px] flex-1 sm:min-h-[400px] lg:min-h-[440px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-8 rounded-[1.75rem] border border-dashed border-border/25 bg-gradient-to-br from-muted/15 via-transparent to-muted/10"
        />

        {/* Subtle connection lines */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full opacity-30"
        >
          <line
            x1="50%"
            y1="50%"
            x2="20%"
            y2="18%"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
          <line
            x1="50%"
            y1="50%"
            x2="80%"
            y2="18%"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
          <line
            x1="50%"
            y1="50%"
            x2="50%"
            y2="82%"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
        </svg>

        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const isCenter = node.position === "center";

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node)}
              className={cn(
                "enterprise-card-premium absolute cursor-pointer rounded-2xl border text-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg",
                positionClass[node.position],
                node.accent,
                node.compact ? "px-4 py-3 text-sm" : "px-5 py-4",
                isCenter && "border-2 shadow-lg shadow-primary/10",
                isSelected && "ring-2 ring-primary/30 enterprise-node-pulse",
              )}
            >
              <div
                className={cn(
                  "font-medium tracking-[-0.01em]",
                  isCenter && "text-lg sm:text-xl",
                )}
              >
                {node.name}
              </div>
              <div className="mt-1 text-[11px] leading-snug opacity-80">
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