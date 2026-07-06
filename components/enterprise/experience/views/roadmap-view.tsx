"use client";

import { CheckCircle2, Circle, Sparkles } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

import { PageHeader } from "../page-header";

const PHASES = [
  { key: "today" as const, icon: CheckCircle2, style: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700" },
  { key: "next" as const, icon: Circle, style: "border-primary/30 bg-primary/5 text-primary" },
  { key: "future" as const, icon: Sparkles, style: "border-violet-500/30 bg-violet-500/5 text-violet-700" },
];

type RoadmapPhase = {
  label: string;
  tagline: string;
  items: Array<{ title: string; desc: string }>;
};

type RoadmapData = {
  footer: string;
  phases: Record<string, RoadmapPhase>;
};

export function RoadmapView() {
  const { t, messages } = useEnterpriseLocale();
  const roadmap = messages.narrative.roadmap as RoadmapData;

  return (
    <div>
      <PageHeader
        eyebrow={t("views", "roadmap.eyebrow")}
        title={t("views", "roadmap.title")}
        description={t("enterprise", "slogan.core")}
      />

      <Stagger className="space-y-8">
        {PHASES.map(({ key, icon: Icon, style }) => {
          const phase = roadmap.phases[key];
          return (
            <StaggerItem key={key}>
              <EnterpriseGlassCard padding="lg">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className={cn("flex size-10 items-center justify-center rounded-xl border", style)}>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{phase.label}</h2>
                    <p className="text-sm text-muted-foreground">{phase.tagline}</p>
                  </div>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {phase.items.map((item) => (
                    <li
                      key={item.title}
                      className="enterprise-list-item rounded-xl border border-border/30 px-4 py-3"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </EnterpriseGlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>

      <FadeIn delay={0.15} className="mt-8">
        <p className="text-center text-xs text-muted-foreground">
          {roadmap.footer}
        </p>
      </FadeIn>
    </div>
  );
}