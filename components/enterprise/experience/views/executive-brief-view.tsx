"use client";

import { ArrowRight, AlertTriangle, Lightbulb, Heart, ShieldAlert, Zap } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EntityLink } from "../entity-link";
import { PageHeader } from "../page-header";
import { BRIEF_CARDS } from "../mock-data";
import type { BriefItemTone } from "../types";

const SECTIONS: Array<{
  tone: BriefItemTone;
  title: string;
  icon: typeof AlertTriangle;
  color: string;
}> = [
  { tone: "critical", title: "Critical Issues", icon: AlertTriangle, color: "text-red-600 bg-red-500/10" },
  { tone: "opportunity", title: "Opportunities", icon: Lightbulb, color: "text-emerald-600 bg-emerald-500/10" },
  { tone: "health", title: "Customer Health", icon: Heart, color: "text-blue-600 bg-blue-500/10" },
  { tone: "risk", title: "Risks", icon: ShieldAlert, color: "text-amber-600 bg-amber-500/10" },
  { tone: "action", title: "Recommended Actions", icon: Zap, color: "text-violet-600 bg-violet-500/10" },
];

export function ExecutiveBriefView() {
  const { navigateToEntity, navigate } = useEnterprise();

  return (
    <div>
      <PageHeader
        eyebrow="Executive Brief"
        title="Good morning, Ary"
        description="Your organization at a glance — critical issues, opportunities, and recommended actions in under 30 seconds."
        action={
          <div className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground">
            <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live • 3 items need attention
          </div>
        }
      />

      <Stagger className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const items = BRIEF_CARDS.filter((c) => c.tone === section.tone);
          const Icon = section.icon;
          return (
            <StaggerItem key={section.tone}>
              <EnterpriseGlassCard padding="lg" className="h-full">
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn("flex size-9 items-center justify-center rounded-xl", section.color)}>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[15px] font-semibold tracking-tight">{section.title}</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="group rounded-xl border border-border/30 p-4 transition-all duration-200 hover:border-border/60 hover:bg-muted/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">{item.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                          {item.entityType && item.entityId ? (
                            <div className="mt-2">
                              <EntityLink type={item.entityType} id={item.entityId}>
                                View {item.entityType} →
                              </EntityLink>
                            </div>
                          ) : null}
                        </div>
                        {item.metric ? (
                          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                            {item.metric}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </EnterpriseGlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>

      <FadeIn delay={0.2} className="mt-8">
        <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Demo story (~3 min): Brief → Organization → PLN → Memory → Timeline
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigateToEntity("company", "pln")}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              PLN <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "organization" })}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Organization map <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "memory", memoryTab: "communications" })}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Memory <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}