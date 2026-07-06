"use client";

import { ArrowRight } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";

import { AskIdaPanel } from "../ask-ida-panel";
import { useEnterprise } from "../enterprise-context";
import { IDA_CORE_MESSAGE } from "../narrative";
import { RealityConnectPanel } from "../reality-connect-panel";
import { PageHeader } from "../page-header";

export function ImportView() {
  const { navigate } = useEnterprise();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reality First"
        title="Connect your organization"
        description={`${IDA_CORE_MESSAGE} Start by importing real emails and documents — the dashboard updates in under 2 minutes.`}
      />

      <RealityConnectPanel />
      <AskIdaPanel />

      <FadeIn delay={0.1}>
        <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            After import → check Executive Brief and Timeline for live updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ view: "executive-brief" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Executive Brief <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "timeline" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Timeline <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}