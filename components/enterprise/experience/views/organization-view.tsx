"use client";

import { useState } from "react";

import { LivingOrganizationMap } from "@/components/enterprise/living-organization-map";
import {
  DEFAULT_NODE,
  MAP_NODES,
  ORGANIZATION_OVERVIEW,
} from "@/components/enterprise/demo-data";
import type { OrganizationNode } from "@/components/enterprise/types";

import { useEnterprise } from "../enterprise-context";
import { IDA_CORE_MESSAGE } from "../narrative";
import { PageHeader } from "../page-header";

export function OrganizationView() {
  const { navigateToEntity } = useEnterprise();
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
        eyebrow="Organization"
        title="How everything connects"
        description={`${IDA_CORE_MESSAGE} Accounts, initiatives, and teams — linked in one living map.`}
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