"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import NextLink from "next/link";

import { LivingOrganizationMap } from "@/components/enterprise/living-organization-map";
import {
  DEFAULT_NODE,
  MAP_NODES,
  ORGANIZATION_OVERVIEW,
} from "@/components/enterprise/demo-data";
import type { OrganizationNode } from "@/components/enterprise/types";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { AskIdaPanel } from "../ask-ida-panel";
import { CHAT_URL, DEMO_URL } from "../demo-urls";
import { useEnterprise } from "../enterprise-context";
import { PageHeader } from "../page-header";
import { ExecutiveBriefSection } from "../sections/executive-brief-section";
import { TimelineSection } from "../sections/timeline-section";
import { WorkforceHubSection } from "../sections/workforce-hub-section";
import { WorkspaceSection } from "../workspace-section";

const DECISION_CORE_STEPS = [
  "understand",
  "analyze",
  "recommend",
  "decide",
  "orchestrate",
  "learn",
] as const;

export function OverviewView() {
  const { navigateToEntity } = useEnterprise();
  const { t } = useEnterpriseLocale();
  const [selectedNode, setSelectedNode] = useState<OrganizationNode>(DEFAULT_NODE);

  function handleSelect(node: OrganizationNode) {
    setSelectedNode(node);
    if (node.id === "pln") navigateToEntity("company", "pln");
    if (node.id === "segment-7") navigateToEntity("project", "segment-7");
    if (node.id === "mayora") navigateToEntity("company", "mayora");
    if (node.id === "telkom") navigateToEntity("company", "telkom");
    if (node.id === "ary") navigateToEntity("person", "ary");
  }

  return (
    <div className="space-y-10">
      {/* HERO / INTRO — Enterprise Decision Layer */}
      <div className="space-y-5">
        <PageHeader
          eyebrow={t("enterprise", "workspace.eyebrow")}
          title={t("enterprise", "workspace.title")}
          description={`${t("enterprise", "slogan.core")} · ${t("enterprise", "workspace.description")}`}
        />

        <FadeIn>
          <div className="flex flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-center">
            <NextLink
              href={DEMO_URL}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {t("enterprise", "workspace.ctaPrimary")}
              <ArrowRight className="size-4" />
            </NextLink>
            <NextLink
              href={CHAT_URL}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-6 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              {t("enterprise", "workspace.ctaSecondary")}
            </NextLink>
          </div>
        </FadeIn>

        <FadeIn delay={0.04}>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:text-left">
            {t("enterprise", "decisionCore.valueChainLabel")}:{" "}
            <span className="font-medium normal-case tracking-normal text-muted-foreground">
              {t("enterprise", "slogan.valueChain")}
            </span>
          </p>
        </FadeIn>
      </div>

      {/* Decision Intelligence Core */}
      <FadeIn delay={0.05}>
        <WorkspaceSection
          eyebrow={t("enterprise", "decisionCore.eyebrow")}
          title={t("enterprise", "decisionCore.title")}
          description={t("enterprise", "decisionCore.description")}
          highlight
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {DECISION_CORE_STEPS.map((step, index) => (
              <div
                key={step}
                className="rounded-xl border border-border/40 bg-background/60 p-3"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold">
                    {t("enterprise", `decisionCore.steps.${step}.label`)}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t("enterprise", `decisionCore.steps.${step}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </WorkspaceSection>
      </FadeIn>

      <FadeIn delay={0.06}>
        <WorkspaceSection
          eyebrow={t("enterprise", "brief.eyebrow")}
          title={t("enterprise", "workspace.briefTitle")}
          description={t("enterprise", "brief.descriptionCeo")}
        >
          <ExecutiveBriefSection />
        </WorkspaceSection>
      </FadeIn>

      <FadeIn delay={0.08}>
        <WorkspaceSection
          eyebrow={t("enterprise", "nav.organization")}
          title={t("enterprise", "workspace.organizationTitle")}
          description={t("views", "organization.description")}
        >
          <LivingOrganizationMap
            nodes={MAP_NODES}
            selectedNodeId={selectedNode.id}
            onSelectNode={handleSelect}
            onReset={() => setSelectedNode(ORGANIZATION_OVERVIEW)}
          />
        </WorkspaceSection>
      </FadeIn>

      <FadeIn delay={0.1}>
        <WorkspaceSection
          eyebrow={t("enterprise", "nav.workforce")}
          title={t("enterprise", "workspace.workforceTitle")}
          description={t("enterprise", "slogan.workforce")}
          highlight
        >
          <WorkforceHubSection />
        </WorkspaceSection>
      </FadeIn>

      <FadeIn delay={0.14}>
        <WorkspaceSection
          eyebrow={t("enterprise", "nav.askIda")}
          title={t("enterprise", "workspace.askTitle")}
          description={t("enterprise", "workspace.askDescription")}
        >
          <AskIdaPanel compact />
        </WorkspaceSection>
      </FadeIn>

      <FadeIn delay={0.18}>
        <WorkspaceSection
          eyebrow={t("enterprise", "nav.timeline")}
          title={t("enterprise", "workspace.timelineTitle")}
          description={t("views", "timeline.description")}
        >
          <TimelineSection limit={5} />
        </WorkspaceSection>
      </FadeIn>

      {/* CLOSING CTAs */}
      <FadeIn delay={0.2}>
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-background to-violet-500/[0.04] px-6 py-8 text-center sm:px-10">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t("enterprise", "workspace.closingTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            {t("enterprise", "workspace.closingDescription")}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NextLink
              href={DEMO_URL}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {t("enterprise", "workspace.closingPrimary")}
              <ArrowRight className="size-4" />
            </NextLink>
            <NextLink
              href={CHAT_URL}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-7 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              {t("enterprise", "workspace.closingSecondary")}
            </NextLink>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
