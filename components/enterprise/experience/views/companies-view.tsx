"use client";

import { ArrowRight } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { COMPANIES, getCompany, PROJECTS, PEOPLE } from "../mock-data";
import { PageHeader } from "../page-header";
import { EntityLink } from "../entity-link";

export function CompaniesView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const selected = entityId ? getCompany(entityId) : null;

  if (selected) {
    const relatedProjects = PROJECTS.filter((p) => p.companyId === selected.id);
    const relatedPeople = PEOPLE.filter((p) => p.companyId === selected.id);

    return (
      <div>
        <PageHeader
          eyebrow="Company"
          title={selected.name}
          description={selected.summary}
          action={
            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Health {selected.health}%
            </div>
          }
        />
        <FadeIn className="grid gap-6 lg:grid-cols-3">
          <EnterpriseGlassCard padding="lg" className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">Overview</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Sector</dt><dd className="font-medium">{selected.sector}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Revenue / Pipeline</dt><dd className="font-medium">{selected.revenue}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Contacts</dt><dd className="font-medium">{selected.contacts}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Active Projects</dt><dd className="font-medium">{selected.activeProjects}</dd></div>
            </dl>
          </EnterpriseGlassCard>
          <EnterpriseGlassCard padding="lg">
            <h3 className="mb-4 text-sm font-semibold">Related People</h3>
            <ul className="space-y-2">
              {relatedPeople.map((p) => (
                <li key={p.id}>
                  <EntityLink type="person" id={p.id}>{p.name}</EntityLink>
                  <span className="text-xs text-muted-foreground"> — {p.role}</span>
                </li>
              ))}
              {relatedPeople.length === 0 ? <li className="text-sm text-muted-foreground">No contacts indexed</li> : null}
            </ul>
          </EnterpriseGlassCard>
        </FadeIn>
        <FadeIn delay={0.1} className="mt-6">
          <EnterpriseGlassCard padding="lg">
            <h3 className="mb-4 text-sm font-semibold">Projects</h3>
            <ul className="space-y-3">
              {relatedProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-border/30 p-3">
                  <EntityLink type="project" id={p.id}>{p.name}</EntityLink>
                  <span className="text-xs text-muted-foreground">{p.progress}% • {p.status}</span>
                </li>
              ))}
            </ul>
          </EnterpriseGlassCard>
        </FadeIn>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Companies"
        title="Customer portfolio"
        description="Health, pipeline, and cross-links to people and projects."
      />
      <Stagger className="grid gap-4 sm:grid-cols-2">
        {COMPANIES.map((company) => (
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
                  Open profile <ArrowRight className="size-3" />
                </span>
              </EnterpriseGlassCard>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}