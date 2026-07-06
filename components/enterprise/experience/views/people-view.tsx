"use client";

import { Users } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { EntityLink } from "../entity-link";
import { IDA_CORE_MESSAGE } from "../narrative";
import { getCompany, getPerson, PEOPLE } from "../mock-data";
import { PageHeader } from "../page-header";

export function PeopleView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const selected = entityId ? getPerson(entityId) : null;

  if (entityId && !selected) {
    return (
      <div>
        <PageHeader eyebrow="Stakeholders" title="Stakeholder not found" />
        <EmptyState
          icon={Users}
          title="This stakeholder record is unavailable"
          description="The contact may have been archived or access may be restricted. Return to the directory to view indexed relationships."
        />
      </div>
    );
  }

  if (selected) {
    const company = getCompany(selected.companyId);
    return (
      <div>
        <PageHeader
          eyebrow="Stakeholder"
          title={selected.name}
          description={selected.summary}
        />
        <EnterpriseGlassCard padding="lg">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Role</dt><dd className="font-medium">{selected.role}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="font-medium">{selected.email}</dd></div>
            <div>
              <dt className="text-xs text-muted-foreground">Organization</dt>
              <dd className="font-medium">
                {company ? (
                  <EntityLink type="company" id={company.id}>{company.name}</EntityLink>
                ) : (
                  "IDA"
                )}
              </dd>
            </div>
            <div><dt className="text-xs text-muted-foreground">Last activity</dt><dd className="font-medium">{selected.lastActive}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Engagements indexed</dt><dd className="font-medium">{selected.engagements}</dd></div>
          </dl>
        </EnterpriseGlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Stakeholders"
        title="Relationship directory"
        description={`${IDA_CORE_MESSAGE} The people behind your accounts and initiatives.`}
      />
      <Stagger className="grid gap-4 sm:grid-cols-2">
        {PEOPLE.map((person) => (
          <StaggerItem key={person.id}>
            <button type="button" onClick={() => navigateToEntity("person", person.id)} className="w-full text-left">
              <EnterpriseGlassCard padding="lg" interactive>
                <h3 className="font-semibold">{person.name}</h3>
                <p className="text-sm text-muted-foreground">{person.role}</p>
                <p className="mt-2 text-xs text-muted-foreground">{person.summary}</p>
              </EnterpriseGlassCard>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}