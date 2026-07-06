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
import { PageHeader } from "../page-header";

export function OrganizationView() {
  const { navigateToEntity } = useEnterprise();
  const [selectedNode, setSelectedNode] = useState<OrganizationNode>(DEFAULT_NODE);

  function handleSelect(node: OrganizationNode) {
    setSelectedNode(node);
    if (node.id === "pln") navigateToEntity("company", "pln");
    if (node.id === "alpha") navigateToEntity("project", "alpha");
    if (node.id === "ary") navigateToEntity("person", "ary");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Organization"
        title="Living Organization"
        description="One system. Many connections. Click a node to navigate across the platform."
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