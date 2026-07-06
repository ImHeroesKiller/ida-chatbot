"use client";

import { useState } from "react";

import { LivingOrganizationMap } from "@/components/enterprise/living-organization-map";
import {
  DEFAULT_NODE,
  MAP_NODES,
  ORGANIZATION_OVERVIEW,
} from "@/components/enterprise/demo-data";
import type { OrganizationNode } from "@/components/enterprise/types";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "../enterprise-context";
import { PageHeader } from "../page-header";

export function OrganizationView() {
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
    <div>
      <PageHeader
        eyebrow={t("views", "organization.eyebrow")}
        title={t("views", "organization.title")}
        description={`${t("enterprise", "slogan.core")} ${t("views", "organization.description")}`}
      />
      <LivingOrganizationMap
        nodes={MAP_NODES}
        selectedNodeId={selectedNode.id}
        onSelectNode={handleSelect}
        onReset={() => setSelectedNode(ORGANIZATION_OVERVIEW)}
      />
    </div>
  );
}