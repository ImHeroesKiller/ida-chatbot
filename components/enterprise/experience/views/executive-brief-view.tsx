"use client";

import { ArrowRight, AlertTriangle, Bot, Lightbulb, Heart, ShieldAlert, Zap } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyStateInline } from "../empty-state";
import { EntityLink } from "../entity-link";
import { PageHeader } from "../page-header";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

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

export function ExecutiveBriefView() {
  const { navigateToEntity, navigate, perspective } = useEnterprise();
  const { t, tv, format } = useEnterpriseLocale();
  const { briefCards, live, reality, workforceInsightReady, perspectiveConfig } =
    useEnterpriseData();
  const isCeo = perspective === "ceo";
  const filteredCards = isCeo
    ? briefCards
    : briefCards.filter((c) =>
        (PERSPECTIVE_BRIEF_TONES[perspective] ?? []).includes(c.tone),
      );
  const criticalCount = filteredCards.filter((c) => c.tone === "critical").length;

  return (
    <div>
      <PageHeader
        eyebrow={
          isCeo
            ? t("enterprise", "brief.eyebrow")
            : t("enterprise", "brief.eyebrowRole", { role: perspectiveConfig.label })
        }
        title={perspectiveConfig.greeting}
        description={
          isCeo
            ? `${t("enterprise", "slogan.workforce")} ${t("enterprise", "brief.descriptionCeo")}`
            : perspectiveConfig.description
        }
        action={
          <div className="flex flex-col items-end gap-2">
            <PerspectiveSelector compact />
            <div className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground">
              <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
              {live ? t("enterprise", "brief.statusLive") : t("enterprise", "brief.statusPreview")} •{" "}
              {t("enterprise", "brief.itemsAttention", { count: criticalCount })}
              {workforceInsightReady ? ` · ${t("enterprise", "brief.workforceInsight")}` : ""}
              {live && reality?.lastSync
                ? ` · ${t("enterprise", "brief.synced", { time: format.time(reality.lastSync) })}`
                : ""}
            </div>
          </div>
        }
      />

      <Stagger className="grid gap-6 lg:grid-cols-2">
        {SECTION_META.map((section) => {
          const items = filteredCards.filter((c) => c.tone === section.tone);
          const Icon = section.icon;
          return (
            <StaggerItem key={section.tone}>
              <EnterpriseGlassCard padding="lg" className="h-full">
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn("flex size-9 items-center justify-center rounded-xl", section.color)}>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[15px] font-semibold tracking-tight">{t("enterprise", section.titleKey)}</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <EmptyStateInline
                    title={t("enterprise", "empty.inlineTitle")}
                    description={t("enterprise", "empty.inlineDesc")}
                  />
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "enterprise-list-item group rounded-xl border p-4",
                          item.workforce
                            ? "border-violet-500/30 bg-violet-500/5 ring-1 ring-violet-500/20"
                            : "border-border/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
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
          <p className="text-sm text-muted-foreground">{t("enterprise", "brief.footerStory")}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ view: "workforce" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("enterprise", "brief.links.workforce")} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "why-ida" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("enterprise", "brief.links.whyIda")} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateToEntity("company", "pln")}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("enterprise", "brief.links.pln")} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "organization" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("enterprise", "brief.links.organization")} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "memory", memoryTab: "communications" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("enterprise", "brief.links.knowledge")} <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}