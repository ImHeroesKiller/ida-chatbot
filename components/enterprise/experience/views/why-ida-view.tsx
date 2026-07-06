"use client";

import { ArrowRight } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";

import { useEnterprise } from "../enterprise-context";
import { IDA_CORE_MESSAGE, LANDING_FOUR_QUESTIONS } from "../narrative";
import { HowIdaThinks } from "../positioning/how-ida-thinks";
import { OrganizationMemoryWow } from "../positioning/organization-memory-wow";
import { WhyIdaComparison } from "../positioning/why-ida-comparison";
import { WhyNotCopilot } from "../positioning/why-not-copilot";
import { PageHeader } from "../page-header";

export function WhyIdaView() {
  const { navigateToEntity, navigate, openFaq } = useEnterprise();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Start here"
        title="Why IDA?"
        description={IDA_CORE_MESSAGE}
        action={
          <button
            type="button"
            onClick={() => openFaq()}
            className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Investor FAQ →
          </button>
        }
      />

      <FadeIn>
        <div className="grid gap-3 sm:grid-cols-2">
          {LANDING_FOUR_QUESTIONS.map((q) => (
            <EnterpriseGlassCard key={q.id} padding="md">
              <h3 className="text-sm font-semibold">{q.question}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{q.answer}</p>
            </EnterpriseGlassCard>
          ))}
        </div>
      </FadeIn>

      <WhyIdaComparison />
      <HowIdaThinks />
      <WhyNotCopilot />
      <OrganizationMemoryWow />

      <FadeIn delay={0.24}>
        <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Continue the story — executive brief, then PLN Indonesia Power, then the organization map.
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
              onClick={() => navigateToEntity("company", "pln")}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              PLN account <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "roadmap" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Roadmap <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}