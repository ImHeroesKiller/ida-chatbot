"use client";

import { ArrowRight, AlertTriangle, Lightbulb, Heart, ShieldAlert, Zap } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyStateInline } from "../empty-state";
import { EntityLink } from "../entity-link";
import { PageHeader } from "../page-header";
import { IDA_CORE_MESSAGE } from "../narrative";
import { useEnterpriseData } from "../use-enterprise-data";
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

const ENTITY_LABEL: Record<string, string> = {
  company: "account",
  person: "stakeholder",
  project: "initiative",
};

export function ExecutiveBriefView() {
  const { navigateToEntity, navigate } = useEnterprise();
  const { briefCards, live, reality } = useEnterpriseData();
  const criticalCount = briefCards.filter((c) => c.tone === "critical").length;

  return (
    <div>
      <PageHeader
        eyebrow="Executive Brief"
        title="Good morning, Ary"
        description={`${IDA_CORE_MESSAGE} Here is what needs your attention today.`}
        action={
          <div className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground">
            <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
            {live ? "Live imported data" : "Preview"} • {criticalCount} items require attention
            {live && reality?.lastSync ? ` · synced ${new Date(reality.lastSync).toLocaleTimeString()}` : ""}
          </div>
        }
      />

      <Stagger className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const items = briefCards.filter((c) => c.tone === section.tone);
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
                {items.length === 0 ? (
                  <EmptyStateInline
                    title="No items in this category"
                    description="Organizational knowledge is current — nothing flagged here today."
                  />
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="enterprise-list-item group rounded-xl border border-border/30 p-4"
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
                                  Open {ENTITY_LABEL[item.entityType] ?? item.entityType} →
                                </EntityLink>
                              </div>
                            ) : null}
                          </div>
                          {item.metric ? (
                            <span className="shrink-0 rounded-md bg-muted/40 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              {item.metric}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </EnterpriseGlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>

      <FadeIn delay={0.2} className="mt-8">
        <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            The demo story — Brief → PLN account → Knowledge → Organization map.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ view: "why-ida" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Why IDA? <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateToEntity("company", "pln")}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              PLN Indonesia Power <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "organization" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Organization map <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "memory", memoryTab: "communications" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Organizational knowledge <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}