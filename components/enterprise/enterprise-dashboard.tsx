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
    <div className="min-h-dvh overflow-y-auto bg-background text-foreground">
      <EnterpriseDashboardHeader />

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-12">
        <section className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm text-muted-foreground">{greetingDate}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Good morning, Ary
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg lg:text-xl">
              Here are 3 things that need your attention today.
            </p>
          </div>
          <div className="ida-glass-subtle shrink-0 self-start rounded-full border border-border/40 px-4 py-2 text-xs text-muted-foreground lg:self-auto">
            Last updated • just now
          </div>
        </section>

        <EnterpriseSectionDivider className="mb-10 lg:mb-12" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <div className="min-w-0 lg:col-span-4">
            <AttentionPanel
              items={PRIORITY_ITEMS}
              quickActions={QUICK_ACTIONS}
            />
          </div>

          <div className="min-w-0 lg:col-span-5">
            <LivingOrganizationMap
              nodes={MAP_NODES}
              selectedNodeId={selectedNode.id}
              onSelectNode={setSelectedNode}
              onReset={() => setSelectedNode(ORGANIZATION_OVERVIEW)}
            />
          </div>

          <div className="min-w-0 lg:col-span-3">
            <CurrentContextPanel node={selectedNode} />
          </div>
        </div>

        <EnterpriseSectionDivider className="my-10 lg:my-14" />

        <EnterpriseMetrics items={METRICS} />
      </main>
    </div>
  );
}