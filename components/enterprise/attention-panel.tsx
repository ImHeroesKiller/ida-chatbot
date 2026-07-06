"use client";

import { AlertTriangle, Briefcase, Users } from "lucide-react";

import {
  EnterpriseGlassCard,
  EnterpriseSectionDivider,
} from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import type { PriorityItem, QuickAction } from "@/components/enterprise/types";
import { cn } from "@/lib/utils";

const toneStyles = {
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15 dark:text-emerald-400",
    badge:
      "border border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400",
    subtitle: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:border-emerald-500/35 hover:bg-emerald-500/[0.03]",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/15 dark:text-amber-400",
    badge:
      "border border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-400",
    subtitle: "text-amber-600 dark:text-amber-400",
    hover: "hover:border-amber-500/35 hover:bg-amber-500/[0.03]",
  },
  red: {
    icon: "bg-red-500/10 text-red-600 ring-1 ring-red-500/15 dark:text-red-400",
    badge: "border border-red-500/20 bg-red-500/8 text-red-700 dark:text-red-400",
    subtitle: "text-red-600 dark:text-red-400",
    hover: "hover:border-red-500/35 hover:bg-red-500/[0.03]",
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
    <div className="flex flex-col gap-10 lg:gap-12">
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            What needs your attention
          </h2>
          <span className="shrink-0 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {items.length} items
          </span>
        </div>

        <Stagger className="flex flex-col gap-4">
          {items.map((item) => {
            const tone = toneStyles[item.tone];
            const Icon = priorityIcons[item.icon];

            return (
              <StaggerItem key={item.id}>
                <EnterpriseGlassCard
                  padding="md"
                  interactive
                  className={cn("group", tone.hover)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
                          tone.icon,
                        )}
                      >
                        <Icon className="size-[18px]" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <div className="text-[15px] font-medium leading-snug tracking-[-0.01em]">
                          {item.title}
                        </div>
                        <div className={cn("text-xs font-medium", tone.subtitle)}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
                        tone.badge,
                      )}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                  {item.meta ? (
                    <p className="mt-1.5 text-xs text-muted-foreground/75">
                      {item.meta}
                    </p>
                  ) : null}
                </EnterpriseGlassCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <EnterpriseSectionDivider />

      <section className="space-y-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Quick Actions
        </h3>
        <Stagger className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {quickActions.map((action) => (
            <StaggerItem key={action.id}>
              <button
                type="button"
                className="enterprise-card-premium ida-hover-lift group w-full rounded-2xl p-5 text-left transition-all duration-300 hover:border-primary/25"
              >
                <div className="text-[14px] font-medium tracking-[-0.01em] transition-colors group-hover:text-foreground">
                  {action.title}
                </div>
                <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  );
}