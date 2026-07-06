"use client";

import { ArrowRight } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";

import { useEnterprise } from "../enterprise-context";
import { HowIdaThinks } from "../positioning/how-ida-thinks";
import { OrganizationMemoryWow } from "../positioning/organization-memory-wow";
import { WhyIdaComparison } from "../positioning/why-ida-comparison";
import { WhyNotCopilot } from "../positioning/why-not-copilot";
import { PageHeader } from "../page-header";

export function WhyIdaView() {
  const { navigateToEntity, navigate } = useEnterprise();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Positioning"
        title="Why IDA?"
        description="In 30 seconds: IDA is not another chatbot. It is an organizational intelligence system with memory, context, and governed decisions."
      />

      <WhyIdaComparison />
      <HowIdaThinks />
      <WhyNotCopilot />

      <OrganizationMemoryWow />

      <FadeIn delay={0.24}>
        <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            See it live — PLN Indonesia Power account with full organizational memory and relationship map.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigateToEntity("company", "pln")}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              PLN account detail <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "organization" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Living organization <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}