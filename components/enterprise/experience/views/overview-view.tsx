"use client";

import { useState } from "react";

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
import { useEnterprise } from "../enterprise-context";
import { PageHeader } from "../page-header";
import { ExecutiveBriefSection } from "../sections/executive-brief-section";
import { TimelineSection } from "../sections/timeline-section";
import { WorkforceHubSection } from "../sections/workforce-hub-section";
import { WorkspaceSection } from "../workspace-section";

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
      <PageHeader
        eyebrow={t("enterprise", "workspace.eyebrow")}
        title={t("enterprise", "workspace.title")}
        description={`${t("enterprise", "slogan.core")} · ${t("enterprise", "workspace.description")}`}
      />

      <FadeIn>
        <WorkspaceSection
          eyebrow={t("enterprise", "brief.eyebrow")}
          title={t("enterprise", "workspace.briefTitle")}
          description={t("enterprise", "brief.descriptionCeo")}
        >
          <ExecutiveBriefSection />
        </WorkspaceSection>
      </FadeIn>

      <FadeIn delay={0.06}>
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
          description={t("enterprise", "slogan.core")}
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
    </div>
  );
}