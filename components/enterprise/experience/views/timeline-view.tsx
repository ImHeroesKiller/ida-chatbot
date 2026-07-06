"use client";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";

import { useEnterprise } from "../enterprise-context";
import { TIMELINE } from "../mock-data";
import { PageHeader } from "../page-header";

export function TimelineView() {
  const { navigateToEntity } = useEnterprise();

  return (
    <div>
      <PageHeader
        eyebrow="Timeline"
        title="Organization timeline"
        description="Communications, meetings, decisions, and commercial events in one stream."
      />
      <Stagger className="relative space-y-0">
        {TIMELINE.map((event, index) => (
          <StaggerItem key={event.id}>
            <div className="flex gap-4 pb-8">
              <div className="flex flex-col items-center">
                <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                {index < TIMELINE.length - 1 ? (
                  <div className="mt-1 w-px flex-1 bg-border/50" />
                ) : null}
              </div>
              <EnterpriseGlassCard padding="md" className="mb-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {event.date} • {event.type}
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
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Open →
                    </button>
                  ) : null}
                </div>
              </EnterpriseGlassCard>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}