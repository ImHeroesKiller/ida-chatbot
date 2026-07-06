"use client";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import type { MetricItem } from "@/components/enterprise/types";
import { cn } from "@/lib/utils";

const valueTone = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  default: "text-foreground",
} as const;

type EnterpriseMetricsProps = {
  items: MetricItem[];
};

export function EnterpriseMetrics({ items }: EnterpriseMetricsProps) {
  return (
    <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {items.map((item) => (
        <StaggerItem key={item.id}>
          <EnterpriseGlassCard padding="lg" interactive className="group">
            <div
              className={cn(
                "text-[2rem] font-semibold leading-none tracking-[-0.03em] transition-transform duration-300 group-hover:scale-[1.02] sm:text-4xl",
                valueTone[item.tone],
              )}
            >
              {item.value}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              {item.label}
            </p>
          </EnterpriseGlassCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}