"use client";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EntityLink } from "../entity-link";
import { getCompany, getPerson, getProject, PROJECTS } from "../mock-data";
import { PageHeader } from "../page-header";

const statusStyle = {
  "on-track": "bg-emerald-500/10 text-emerald-700",
  "at-risk": "bg-amber-500/10 text-amber-700",
  stalled: "bg-red-500/10 text-red-700",
};

export function ProjectsView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const selected = entityId ? getProject(entityId) : null;

  if (selected) {
    const company = getCompany(selected.companyId);
    const owner = getPerson(selected.ownerId);
    return (
      <div>
        <PageHeader eyebrow="Project" title={selected.name} description={selected.summary} />
        <EnterpriseGlassCard padding="lg">
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${selected.progress}%` }} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="capitalize">{selected.status}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Budget</dt><dd>{selected.budget}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Company</dt><dd>{company ? <EntityLink type="company" id={company.id}>{company.name}</EntityLink> : "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Owner</dt><dd>{owner ? <EntityLink type="person" id={owner.id}>{owner.name}</EntityLink> : "—"}</dd></div>
          </dl>
        </EnterpriseGlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Projects" title="Active initiatives" description="Track progress, risk, and commercial impact." />
      <Stagger className="grid gap-4">
        {PROJECTS.map((project) => (
          <StaggerItem key={project.id}>
            <button type="button" onClick={() => navigateToEntity("project", project.id)} className="w-full text-left">
              <EnterpriseGlassCard padding="lg" interactive>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusStyle[project.status])}>{project.status}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">{project.budget} • {project.progress}% • Updated {project.updatedAt}</p>
              </EnterpriseGlassCard>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}