"use client";

import { Bot, Brain } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { useEnterpriseData } from "../use-enterprise-data";
import { PageHeader } from "../page-header";
import type { MemoryTab } from "../types";

const TABS: MemoryTab[] = [
  "communications",
  "meetings",
  "projects",
  "commercial",
  "decisions",
  "notes",
];

export function MemoryView() {
  const { memoryTab, navigate, navigateToEntity } = useEnterprise();
  const { memoryItems } = useEnterpriseData();
  const { t } = useEnterpriseLocale();
  const items = memoryItems.filter((m) => m.tab === memoryTab);

  return (
    <div>
      <PageHeader
        eyebrow={t("enterprise", "memory.eyebrow")}
        title={t("enterprise", "memory.title")}
        description={`${t("enterprise", "slogan.core")} · ${t("enterprise", "memory.description")}`}
      />

      <FadeIn className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => navigate({ view: "memory", memoryTab: tab })}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium transition-all duration-200",
              memoryTab === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground",
            )}
          >
            {t("enterprise", `memory.tabs.${tab}`)}
          </button>
        ))}
      </FadeIn>

      {items.length === 0 ? (
        <EmptyState
          icon={Brain}
          title={t("enterprise", "memory.emptyTitle")}
          description={t("enterprise", "memory.emptyDesc")}
        />
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() =>
                  item.entityType && item.entityId
                    ? navigateToEntity(item.entityType, item.entityId)
                    : undefined
                }
              >
                <EnterpriseGlassCard
                  padding="md"
                  interactive
                  className={cn(
                    "h-full",
                    item.workforce && "ring-1 ring-violet-500/25",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {item.date}
                    </p>
                    {item.workforce ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        <Bot className="size-2.5" />
                        {t("enterprise", "memory.workforceBadge")}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                </EnterpriseGlassCard>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}