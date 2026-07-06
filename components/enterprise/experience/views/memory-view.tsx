"use client";

import { Brain } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { IDA_CORE_MESSAGE } from "../narrative";
import { useEnterpriseData } from "../use-enterprise-data";
import { PageHeader } from "../page-header";
import type { MemoryTab } from "../types";

const TABS: Array<{ id: MemoryTab; label: string }> = [
  { id: "communications", label: "Communications" },
  { id: "meetings", label: "Meetings" },
  { id: "projects", label: "Projects" },
  { id: "commercial", label: "Commercial" },
  { id: "decisions", label: "Decisions" },
  { id: "notes", label: "Notes" },
];

export function MemoryView() {
  const { memoryTab, navigate, navigateToEntity } = useEnterprise();
  const { memoryItems } = useEnterpriseData();
  const items = memoryItems.filter((m) => m.tab === memoryTab);

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="What your organization knows"
        description={`${IDA_CORE_MESSAGE} Every email, meeting, and decision — indexed and linked to accounts and initiatives.`}
      />

      <FadeIn className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate({ view: "memory", memoryTab: tab.id })}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium transition-all duration-200",
              memoryTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </FadeIn>

      {items.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No knowledge records in this category"
          description="Communications, meetings, and decisions captured by your organization will appear here — indexed and cross-linked automatically."
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
                <EnterpriseGlassCard padding="md" interactive className="h-full">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {item.date}
                  </p>
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