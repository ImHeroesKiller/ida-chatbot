import { AlertTriangle, Briefcase, Users } from "lucide-react";

import {
  EnterpriseGlassCard,
  EnterpriseSectionDivider,
} from "@/components/enterprise/enterprise-glass-card";
import type { PriorityItem, QuickAction } from "@/components/enterprise/types";
import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badge: "text-emerald-600 dark:text-emerald-400",
    subtitle: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:border-emerald-500/30",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badge: "text-amber-600 dark:text-amber-400",
    subtitle: "text-amber-600 dark:text-amber-400",
    hover: "hover:border-amber-500/30",
  },
  red: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    badge: "text-red-600 dark:text-red-400",
    subtitle: "text-red-600 dark:text-red-400",
    hover: "hover:border-red-500/30",
  },
} as const;

const priorityIcons = {
  users: Users,
  briefcase: Briefcase,
  alert: AlertTriangle,
} as const;

type AttentionPanelProps = {
  items: PriorityItem[];
  quickActions: QuickAction[];
};

export function AttentionPanel({ items, quickActions }: AttentionPanelProps) {
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">
            What needs your attention
          </h2>
          <span className="shrink-0 text-xs text-muted-foreground">
            {items.length} items
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const tone = toneStyles[item.tone];
            const Icon = priorityIcons[item.icon];

            return (
              <EnterpriseGlassCard
                key={item.id}
                padding="md"
                className={cn(
                  "ida-hover-lift cursor-pointer transition-all",
                  tone.hover,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        tone.icon,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium leading-snug">{item.title}</div>
                      <div className={cn("text-xs", tone.subtitle)}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className={cn("shrink-0 text-[10px] font-semibold tracking-wide", tone.badge)}>
                    {item.badge}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{item.detail}</p>
                {item.meta ? (
                  <p className="mt-1 text-xs text-muted-foreground/80">{item.meta}</p>
                ) : null}
              </EnterpriseGlassCard>
            );
          })}
        </div>
      </section>

      <EnterpriseSectionDivider />

      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="ida-glass-subtle ida-hover-lift rounded-2xl border border-border/40 p-4 text-left shadow-sm transition-all hover:border-primary/30"
            >
              <div className="font-medium">{action.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {action.description}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}