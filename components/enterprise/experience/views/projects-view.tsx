"use client";

import { FolderKanban } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { EmptyState } from "../empty-state";
import { EntityLink } from "../entity-link";
import { useEnterpriseData } from "../use-enterprise-data";
import { PageHeader } from "../page-header";

const statusStyle = {
  "on-track": "bg-emerald-500/10 text-emerald-700",
  "at-risk": "bg-amber-500/10 text-amber-700",
  stalled: "bg-red-500/10 text-red-700",
};

export function ProjectsView() {
  const { entityId, navigateToEntity } = useEnterprise();
  const { projects, getProject, getCompany, getPerson } = useEnterpriseData();
  const { t, format } = useEnterpriseLocale();
  const selected = entityId ? getProject(entityId) : null;

  if (entityId && !selected) {
    return (
      <div>
        <PageHeader eyebrow={t("views", "projects.eyebrow")} title={t("views", "projects.notFound")} />
        <EmptyState
          icon={FolderKanban}
          title={t("views", "projects.notFoundTitle")}
          description={t("views", "projects.notFoundDesc")}
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
          eyebrow={t("views", "projects.eyebrowSingle")}
          title={selected.name}
          description={selected.summary}
          action={
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", statusStyle[selected.status])}>
              {format.projectStatus(selected.status)}
            </span>
          }
        />
        <EnterpriseGlassCard padding="lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("views", "projects.progress")}</span>
            <span className="font-semibold text-foreground">{selected.progress}%</span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${selected.progress}%` }}
            />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">{t("views", "projects.contractValue")}</dt><dd className="font-medium">{format.money(selected.budget)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("views", "projects.lastUpdate")}</dt><dd className="font-medium">{format.relative(selected.updatedAt)}</dd></div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("views", "projects.account")}</dt>
              <dd>{company ? <EntityLink type="company" id={company.id}>{company.name}</EntityLink> : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("views", "projects.programOwner")}</dt>
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
        eyebrow={t("views", "projects.eyebrow")}
        title={t("views", "projects.title")}
        description={`${t("enterprise", "slogan.core")} ${t("views", "projects.description")}`}
      />
      <Stagger className="grid gap-4">
        {projects.map((project) => (
          <StaggerItem key={project.id}>
            <button type="button" onClick={() => navigateToEntity("project", project.id)} className="w-full text-left">
              <EnterpriseGlassCard padding="lg" interactive>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusStyle[project.status])}>
                    {format.projectStatus(project.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {format.money(project.budget)} · {project.progress}% {t("views", "projects.complete")} · {t("views", "projects.updated")} {format.relative(project.updatedAt)}
                </p>
              </EnterpriseGlassCard>
            </button>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}