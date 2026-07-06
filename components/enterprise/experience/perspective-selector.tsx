"use client";

import { cn } from "@/lib/utils";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "./enterprise-context";
import type { PerspectiveId } from "./types";

const PERSPECTIVES: PerspectiveId[] = ["ceo", "cfo", "sales", "project", "hr"];

type PerspectiveSelectorProps = {
  compact?: boolean;
  className?: string;
};

export function PerspectiveSelector({ compact = false, className }: PerspectiveSelectorProps) {
  const { perspective, setPerspective, workforceDemoRunning } = useEnterprise();
  const { t } = useEnterpriseLocale();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!compact ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("enterprise", "perspective.label")}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/40 bg-muted/20 p-1">
        {PERSPECTIVES.map((id) => (
          <button
            key={id}
            type="button"
            disabled={workforceDemoRunning}
            onClick={() => setPerspective(id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              perspective === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              workforceDemoRunning && perspective !== id && "opacity-50",
            )}
          >
            {t("enterprise", `perspective.${id}`)}
          </button>
        ))}
      </div>
    </div>
  );
}