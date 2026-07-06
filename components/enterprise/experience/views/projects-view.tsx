"use client";

import { FolderKanban } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { EntityLink } from "../entity-link";
import { getCompany, getPerson, getProject, PROJECTS } from "../mock-data";
import { PageHeader } from "../page-header";

const statusStyle = {
  "on-track": "bg-emerald-500/10 text-emerald-700",
  "at-risk": "bg-amber-500/10 text-amber-700",
  stalled: "bg-red-500/10 text-red-700",
};

const statusLabel = {
  "on-track": "On track",
  "at-risk": "At risk",
  stalled: "Stalled",
};

export function ProjectsView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const selected = entityId ? getProject(entityId) : null;

  if (entityId && !selected) {
    return (
      <div>
        <PageHeader eyebrow="Initiatives" title="Initiative not found" />
        <EmptyState
          icon={FolderKanban}
          title="This initiative record is unavailable"
          description="The project may have been completed or archived. Return to the portfolio to view active delivery initiatives."
        />
      </div>
    );
  }

  if (selected) {
    const company = getCompany(selected.companyId);
    const owner = getPerson(selected.ownerId);
    return (
      <div>
        <PageHeader
          eyebrow="Initiative"
          title={selected.name}
          description={selected.summary}
          action={
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", statusStyle[selected.status])}>
              {statusLabel[selected.status]}
            </span>
          }
        />
        <EnterpriseGlassCard padding="lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Delivery progress</span>
            <span className="font-semibold text-foreground">{selected.progress}%</span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${selected.progress}%` }}
            />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Contract value</dt><dd className="font-medium">{selected.budget}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Last update</dt><dd className="font-medium">{selected.updatedAt}</dd></div>
            <div>
              <dt className="text-xs text-muted-foreground">Account</dt>
              <dd>{company ? <EntityLink type="company" id={company.id}>{company.name}</EntityLink> : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Program owner</dt>
              <dd>{owner ? <EntityLink type="person" id={owner.id}>{owner.name}</EntityLink> : "—"}</dd>
            </div>
          </dl>
        </EnterpriseGlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Initiatives"
        title="Delivery portfolio"
        description="Track milestone progress, commercial exposure, and delivery risk across enterprise accounts."
      />
      <Stagger className="grid gap-4">
        {PROJECTS.map((project) => (
          <StaggerItem key={project.id}>
            <button type="button" onClick={() => navigateToEntity("project", project.id)} className="w-full text-left">
              <EnterpriseGlassCard padding="lg" interactive>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusStyle[project.status])}>
                    {statusLabel[project.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {project.budget} · {project.progress}% complete · Updated {project.updatedAt}
                </p>
              </EnterpriseGlassCard>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}