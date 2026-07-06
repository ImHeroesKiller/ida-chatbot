import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
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
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {items.map((item) => (
        <EnterpriseGlassCard
          key={item.id}
          padding="lg"
          className="ida-hover-lift"
        >
          <div
            className={cn(
              "text-3xl font-semibold tracking-tight sm:text-4xl",
              valueTone[item.tone],
            )}
          >
            {item.value}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
        </EnterpriseGlassCard>
      ))}
    </section>
  );
}