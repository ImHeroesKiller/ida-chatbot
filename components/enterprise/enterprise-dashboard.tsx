"use client";

import { useMemo, useState } from "react";

import { AttentionPanel } from "@/components/enterprise/attention-panel";
import { CurrentContextPanel } from "@/components/enterprise/current-context-panel";
import {
  DEFAULT_NODE,
  MAP_NODES,
  METRICS,
  ORGANIZATION_OVERVIEW,
  PRIORITY_ITEMS,
  QUICK_ACTIONS,
} from "@/components/enterprise/demo-data";
import { EnterpriseDashboardHeader } from "@/components/enterprise/enterprise-dashboard-header";
import { EnterpriseMetrics } from "@/components/enterprise/enterprise-metrics";
import { EnterpriseSectionDivider } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { LivingOrganizationMap } from "@/components/enterprise/living-organization-map";
import type { OrganizationNode } from "@/components/enterprise/types";

function getGreetingDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

export function EnterpriseDashboard() {
  const [selectedNode, setSelectedNode] =
    useState<OrganizationNode>(DEFAULT_NODE);

  const greetingDate = useMemo(() => getGreetingDate(), []);

  return (
    <div className="enterprise-demo enterprise-demo-bg flex h-dvh max-h-dvh flex-col overflow-hidden font-sans text-foreground">
      <EnterpriseDashboardHeader />

      <main className="enterprise-demo-scroll mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-14">
        <FadeIn>
          <section className="mb-12 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-[13px] font-medium tracking-wide text-muted-foreground/90">
                {greetingDate}
              </p>
              <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem] lg:text-[3rem]">
                Good morning, Ary
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Here are 3 things that need your attention today.
              </p>
            </div>
            <div className="enterprise-card-premium shrink-0 self-start rounded-full px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground lg:self-auto">
              <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Last updated • just now
            </div>
          </section>
        </FadeIn>

        <EnterpriseSectionDivider className="mb-12 lg:mb-14" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          <FadeIn className="min-w-0 lg:col-span-4" delay={0.08}>
            <AttentionPanel
              items={PRIORITY_ITEMS}
              quickActions={QUICK_ACTIONS}
            />
          </FadeIn>

          <FadeIn className="min-w-0 lg:col-span-5" delay={0.14}>
            <LivingOrganizationMap
              nodes={MAP_NODES}
              selectedNodeId={selectedNode.id}
              onSelectNode={setSelectedNode}
              onReset={() => setSelectedNode(ORGANIZATION_OVERVIEW)}
            />
          </FadeIn>

          <FadeIn className="min-w-0 lg:col-span-3" delay={0.2}>
            <CurrentContextPanel node={selectedNode} />
          </FadeIn>
        </div>

        <EnterpriseSectionDivider className="my-12 lg:my-16" />

        <FadeIn delay={0.26}>
          <EnterpriseMetrics items={METRICS} />
        </FadeIn>
      </main>
    </div>
  );
}