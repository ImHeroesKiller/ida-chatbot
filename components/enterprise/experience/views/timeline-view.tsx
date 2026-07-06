"use client";

import { Calendar } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { useEnterpriseData } from "../use-enterprise-data";
import { PageHeader } from "../page-header";

export function TimelineView() {
  const { navigateToEntity } = useEnterprise();
  const { timeline } = useEnterpriseData();
  const { t, format } = useEnterpriseLocale();

  return (
    <div>
      <PageHeader
        eyebrow={t("views", "timeline.eyebrow")}
        title={t("views", "timeline.title")}
        description={`${t("enterprise", "slogan.core")} ${t("views", "timeline.description")}`}
      />
      {timeline.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t("views", "timeline.emptyTitle")}
          description={t("views", "timeline.emptyDesc")}
        />
      ) : (
        <Stagger className="relative space-y-0">
          {timeline.map((event, index) => (
            <StaggerItem key={event.id}>
              <div className="flex gap-4 pb-8">
                <div className="flex flex-col items-center">
                  <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/15 transition-all duration-300" />
                  {index < timeline.length - 1 ? (
                    <div className="mt-1 w-px flex-1 bg-border/50" />
                  ) : null}
                </div>
                <EnterpriseGlassCard padding="md" className="enterprise-list-item mb-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {event.date} · {format.timelineType(event.type)}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold">{event.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {event.summary}
                      </p>
                    </div>
                    {event.entityType && event.entityId ? (
                      <button
                        type="button"
                        onClick={() => navigateToEntity(event.entityType!, event.entityId!)}
                        className="enterprise-text-link shrink-0 text-xs font-medium"
                      >
                        {t("views", "timeline.openRecord")}
                      </button>
                    ) : null}
                  </div>
                </EnterpriseGlassCard>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}