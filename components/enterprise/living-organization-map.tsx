"use client";

import { motion } from "framer-motion";

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

const CONNECTIONS = [
  { x1: "50%", y1: "50%", x2: "20%", y2: "18%" },
  { x1: "50%", y1: "50%", x2: "80%", y2: "18%" },
  { x1: "50%", y1: "50%", x2: "50%", y2: "82%" },
  { x1: "50%", y1: "50%", x2: "8%", y2: "50%" },
  { x1: "50%", y1: "50%", x2: "92%", y2: "50%" },
  { x1: "50%", y1: "50%", x2: "28%", y2: "82%" },
];

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
            Living organization
          </h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Animated relationship intelligence — accounts, initiatives, and functions connected in one view.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-full border border-border/50 bg-background/50 px-5 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted/30 hover:text-foreground sm:self-auto"
        >
          Reset view
        </button>
      </div>

      <div className="relative min-h-[340px] flex-1 sm:min-h-[400px] lg:min-h-[440px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-8 rounded-[1.75rem] border border-dashed border-border/25 bg-gradient-to-br from-muted/15 via-transparent to-muted/10"
        />

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full"
        >
          {CONNECTIONS.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              className="enterprise-connection-flow text-primary/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />
          ))}
        </svg>

        {nodes.map((node, index) => {
          const isSelected = node.id === selectedNodeId;
          const isCenter = node.position === "center";

          return (
            <motion.button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node)}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.06, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={cn(
                "enterprise-card-premium absolute cursor-pointer rounded-2xl border text-center transition-shadow duration-300",
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
                {node.health && !node.compact ? ` · ${node.health}` : ""}
              </div>
            </motion.button>
          );
        })}
      </div>
    </EnterpriseGlassCard>
  );
}