"use client";

import { Users } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { EntityLink } from "../entity-link";
import { useEnterpriseData } from "../use-enterprise-data";
import { PageHeader } from "../page-header";

export function PeopleView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const { people, getPerson, getCompany } = useEnterpriseData();
  const { t, format } = useEnterpriseLocale();
  const selected = entityId ? getPerson(entityId) : null;

  if (entityId && !selected) {
    return (
      <div>
        <PageHeader eyebrow={t("views", "people.eyebrow")} title={t("views", "people.notFound")} />
        <EmptyState
          icon={Users}
          title={t("views", "people.notFoundTitle")}
          description={t("views", "people.notFoundDesc")}
        />
      </div>
    );
  }

  if (selected) {
    const company = getCompany(selected.companyId);
    return (
      <div>
        <PageHeader
          eyebrow={t("views", "people.eyebrowSingle")}
          title={selected.name}
          description={selected.summary}
        />
        <EnterpriseGlassCard padding="lg">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">{t("views", "people.role")}</dt><dd className="font-medium">{selected.role}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("views", "people.email")}</dt><dd className="font-medium">{selected.email}</dd></div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("views", "people.organization")}</dt>
              <dd className="font-medium">
                {company ? (
                  <EntityLink type="company" id={company.id}>{company.name}</EntityLink>
                ) : (
                  "IDA"
                )}
              </dd>
            </div>
            <div><dt className="text-xs text-muted-foreground">{t("enterprise", "people.lastActivity")}</dt><dd className="font-medium">{format.relative(selected.lastActive)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("views", "people.engagements")}</dt><dd className="font-medium">{selected.engagements}</dd></div>
          </dl>
        </EnterpriseGlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("views", "people.eyebrow")}
        title={t("views", "people.title")}
        description={`${t("enterprise", "slogan.core")} ${t("views", "people.description")}`}
      />
      <Stagger className="grid gap-4 sm:grid-cols-2">
        {people.map((person) => (
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