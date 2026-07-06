"use client";

import { ArrowRight, Building2 } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { EntityLink } from "../entity-link";
import { OrganizationMemoryWow } from "../positioning/organization-memory-wow";
import { useEnterpriseData } from "../use-enterprise-data";
import { PageHeader } from "../page-header";

export function CompaniesView() {
  const { entityId, navigate, navigateToEntity } = useEnterprise();
  const { companies, getCompany, projects, people } = useEnterpriseData();
  const { t, format } = useEnterpriseLocale();
  const selected = entityId ? getCompany(entityId) : null;

  if (entityId && !selected) {
    return (
      <div>
        <PageHeader eyebrow={t("views", "companies.eyebrow")} title={t("views", "companies.notFound")} />
        <EmptyState
          icon={Building2}
          title={t("views", "companies.notFoundTitle")}
          description={t("views", "companies.notFoundDesc")}
          action={
            <button
              type="button"
              onClick={() => navigate({ view: "companies" })}
              className="enterprise-text-link text-sm font-medium"
            >
              {t("views", "companies.backPortfolio")}
            </button>
          }
        />
      </div>
    );
  }

  if (selected) {
    const relatedProjects = projects.filter((p) => p.companyId === selected.id);
    const relatedPeople = people.filter((p) => p.companyId === selected.id);

    return (
      <div>
        <PageHeader
          eyebrow={t("views", "companies.eyebrowSingle")}
          title={selected.name}
          description={selected.summary}
          action={
            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t("views", "companies.health")} {selected.health}% · {selected.healthLabel}
            </div>
          }
        />
        <FadeIn className="grid gap-6 lg:grid-cols-3">
          <EnterpriseGlassCard padding="lg" className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">{t("views", "companies.overview")}</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">{t("views", "companies.sector")}</dt><dd className="font-medium">{selected.sector}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("views", "companies.pipelineRevenue")}</dt><dd className="font-medium">{format.money(selected.revenue)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("views", "companies.stakeholdersLabel")}</dt><dd className="font-medium">{selected.contacts}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t("views", "companies.activeInitiatives")}</dt><dd className="font-medium">{selected.activeProjects}</dd></div>
            </dl>
          </EnterpriseGlassCard>
          <EnterpriseGlassCard padding="lg">
            <h3 className="mb-4 text-sm font-semibold">{t("views", "companies.keyStakeholders")}</h3>
            {relatedPeople.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("views", "companies.noStakeholders")}</p>
            ) : (
              <ul className="space-y-2">
                {relatedPeople.map((p) => (
                  <li key={p.id}>
                    <EntityLink type="person" id={p.id}>{p.name}</EntityLink>
                    <span className="text-xs text-muted-foreground"> — {p.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </EnterpriseGlassCard>
        </FadeIn>
        <FadeIn delay={0.1} className="mt-6">
          <EnterpriseGlassCard padding="lg">
            <h3 className="mb-4 text-sm font-semibold">{t("views", "companies.linkedInitiatives")}</h3>
            {relatedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("views", "companies.noInitiatives")}</p>
            ) : (
              <ul className="space-y-3">
                {relatedProjects.map((p) => (
                  <li key={p.id} className="enterprise-list-item flex items-center justify-between rounded-xl border border-border/30 p-3">
                    <EntityLink type="project" id={p.id}>{p.name}</EntityLink>
                    <span className="text-xs text-muted-foreground">{p.progress}% · {format.projectStatus(p.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </EnterpriseGlassCard>
        </FadeIn>
        {selected.id === "pln" ? <OrganizationMemoryWow /> : null}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("views", "companies.eyebrow")}
        title={t("views", "companies.title")}
        description={`${t("enterprise", "slogan.core")} ${t("views", "companies.description")}`}
      />
      <Stagger className="grid gap-4 sm:grid-cols-2">
        {companies.map((company) => (
          <StaggerItem key={company.id}>
            <button
              type="button"
              onClick={() => navigateToEntity("company", company.id)}
              className="w-full text-left"
            >
              <EnterpriseGlassCard padding="lg" interactive className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{company.name}</h3>
                    <p className="text-xs text-muted-foreground">{company.sector}</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    company.health >= 85 ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700",
                  )}>
                    {company.health}%
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{company.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {t("views", "companies.viewProfile")} <ArrowRight className="size-3" />
                </span>
              </EnterpriseGlassCard>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}