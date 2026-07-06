"use client";

import { AlertTriangle, Bot, Lightbulb, Heart, ShieldAlert, Zap } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyStateInline } from "../empty-state";
import { EntityLink } from "../entity-link";
import { PerspectiveSelector } from "../perspective-selector";
import { useEnterpriseData } from "../use-enterprise-data";
import type { BriefItemTone } from "../types";

const SECTION_META: Array<{
  tone: BriefItemTone;
  titleKey: string;
  icon: typeof AlertTriangle;
  color: string;
}> = [
  { tone: "critical", titleKey: "brief.sections.critical", icon: AlertTriangle, color: "text-red-600 bg-red-500/10" },
  { tone: "opportunity", titleKey: "brief.sections.opportunity", icon: Lightbulb, color: "text-emerald-600 bg-emerald-500/10" },
  { tone: "health", titleKey: "brief.sections.health", icon: Heart, color: "text-blue-600 bg-blue-500/10" },
  { tone: "risk", titleKey: "brief.sections.risk", icon: ShieldAlert, color: "text-amber-600 bg-amber-500/10" },
  { tone: "action", titleKey: "brief.sections.action", icon: Zap, color: "text-violet-600 bg-violet-500/10" },
];

const PERSPECTIVE_BRIEF_TONES: Record<string, BriefItemTone[]> = {
  ceo: ["critical", "opportunity", "health", "risk", "action"],
  cfo: ["critical", "risk", "opportunity"],
  sales: ["opportunity", "health", "action"],
  project: ["critical", "risk", "action"],
  hr: ["health", "risk", "opportunity"],
};

export function ExecutiveBriefSection() {
  const { perspective } = useEnterprise();
  const { t, tv, format } = useEnterpriseLocale();
  const { briefCards, live, reality, workforceInsightReady } = useEnterpriseData();
  const isCeo = perspective === "ceo";
  const filteredCards = isCeo
    ? briefCards
    : briefCards.filter((c) =>
        (PERSPECTIVE_BRIEF_TONES[perspective] ?? []).includes(c.tone),
      );
  const criticalCount = filteredCards.filter((c) => c.tone === "critical").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground">
          <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
          {live ? t("enterprise", "brief.statusLive") : t("enterprise", "brief.statusPreview")} •{" "}
          {t("enterprise", "brief.itemsAttention", { count: criticalCount })}
          {workforceInsightReady ? ` · ${t("enterprise", "brief.workforceInsight")}` : ""}
          {live && reality?.lastSync
            ? ` · ${t("enterprise", "brief.synced", { time: format.time(reality.lastSync) })}`
            : ""}
        </div>
        <PerspectiveSelector compact />
      </div>

      <Stagger className="grid gap-4 lg:grid-cols-2">
        {SECTION_META.map((section) => {
          const items = filteredCards.filter((c) => c.tone === section.tone);
          const Icon = section.icon;
          return (
            <StaggerItem key={section.tone}>
              <EnterpriseGlassCard padding="md" className="h-full">
                <div className="mb-3 flex items-center gap-3">
                  <div className={cn("flex size-8 items-center justify-center rounded-xl", section.color)}>
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">{t("enterprise", section.titleKey)}</h3>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <EmptyStateInline
                    title={t("enterprise", "empty.inlineTitle")}
                    description={t("enterprise", "empty.inlineDesc")}
                  />
                ) : (
                  <ul className="space-y-2.5">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "enterprise-list-item rounded-xl border p-3",
                          item.workforce
                            ? "border-violet-500/30 bg-violet-500/5 ring-1 ring-violet-500/20"
                            : "border-border/30",
                        )}
                      >
                        {item.workforce ? (
                          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                            <Bot className="size-3" />
                            {t("enterprise", "brief.workforceBadge")}
                          </p>
                        ) : null}
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                        {item.entityType && item.entityId ? (
                          <div className="mt-2">
                            <EntityLink type={item.entityType} id={item.entityId}>
                              {t("enterprise", "brief.openEntity", {
                                entity:
                                  item.entityType === "company"
                                    ? tv("account")
                                    : item.entityType === "person"
                                      ? tv("stakeholder")
                                      : tv("initiative"),
                              })}
                            </EntityLink>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </EnterpriseGlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}