"use client";

import { Calendar } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { useEnterpriseData } from "../use-enterprise-data";

type TimelineSectionProps = {
  limit?: number;
  showViewAll?: boolean;
};

export function TimelineSection({ limit = 6, showViewAll = true }: TimelineSectionProps) {
  const { navigateToEntity, navigate } = useEnterprise();
  const { timeline } = useEnterpriseData();
  const { t, format } = useEnterpriseLocale();
  const events = limit ? timeline.slice(0, limit) : timeline;

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={t("views", "timeline.emptyTitle")}
        description={t("views", "timeline.emptyDesc")}
      />
    );
  }

  return (
    <div>
      <Stagger className="relative space-y-0">
        {events.map((event, index) => (
          <StaggerItem key={event.id}>
            <div className="flex gap-3 pb-5">
              <div className="flex flex-col items-center">
                <div className="size-2 rounded-full bg-primary ring-4 ring-primary/15" />
                {index < events.length - 1 ? (
                  <div className="mt-1 w-px flex-1 bg-border/50" />
                ) : null}
              </div>
              <EnterpriseGlassCard padding="sm" className="enterprise-list-item mb-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {event.date} · {format.timelineType(event.type)}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold">{event.title}</h3>
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
      {showViewAll && timeline.length > limit ? (
        <button
          type="button"
          onClick={() => navigate({ view: "timeline" })}
          className="enterprise-text-link mt-2 text-sm font-medium"
        >
          {t("enterprise", "workspace.viewFullTimeline")} →
        </button>
      ) : null}
    </div>
  );
}