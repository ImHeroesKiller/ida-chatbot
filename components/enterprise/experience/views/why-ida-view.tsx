"use client";

import { ArrowRight } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "../enterprise-context";
import { HowIdaThinks } from "../positioning/how-ida-thinks";
import { OrganizationMemoryWow } from "../positioning/organization-memory-wow";
import { WhyIdaComparison } from "../positioning/why-ida-comparison";
import { WhyNotCopilot } from "../positioning/why-not-copilot";
import { PageHeader } from "../page-header";

type FourQuestion = { id: string; question: string; answer: string };

export function WhyIdaView() {
  const { navigateToEntity, navigate, openFaq } = useEnterprise();
  const { t, messages } = useEnterpriseLocale();
  const fourQuestions = messages.narrative.fourQuestions as FourQuestion[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("views", "whyIda.eyebrow")}
        title={t("views", "whyIda.title")}
        description={t("enterprise", "slogan.core")}
        action={
          <button
            type="button"
            onClick={() => openFaq()}
            className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("views", "whyIda.investorFaq")}
          </button>
        }
      />

      <FadeIn>
        <div className="grid gap-3 sm:grid-cols-2">
          {fourQuestions.map((q) => (
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
            {t("views", "whyIda.continueStory")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ view: "executive-brief" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("views", "whyIda.links.brief")} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateToEntity("company", "pln")}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("views", "whyIda.links.pln")} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "roadmap" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("views", "whyIda.links.roadmap")} <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}