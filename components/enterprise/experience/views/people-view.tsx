"use client";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";

import { useEnterprise } from "../enterprise-context";
import { EntityLink } from "../entity-link";
import { getCompany, getPerson, PEOPLE } from "../mock-data";
import { PageHeader } from "../page-header";

export function PeopleView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const selected = entityId ? getPerson(entityId) : null;

  if (selected) {
    const company = getCompany(selected.companyId);
    return (
      <div>
        <PageHeader eyebrow="Person" title={selected.name} description={selected.summary} />
        <EnterpriseGlassCard padding="lg">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Role</dt><dd>{selected.role}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Email</dt><dd>{selected.email}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Company</dt><dd>{company ? <EntityLink type="company" id={company.id}>{company.name}</EntityLink> : "IDA"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Last active</dt><dd>{selected.lastActive}</dd></div>
          </dl>
        </EnterpriseGlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="People" title="Key relationships" description="Leaders, account owners, and stakeholders." />
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