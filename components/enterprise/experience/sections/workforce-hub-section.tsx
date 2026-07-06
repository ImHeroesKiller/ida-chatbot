"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

import { useEnterprise } from "../enterprise-context";
import { useWorkforceData } from "../use-workforce-data";

export function WorkforceHubSection() {
  const {
    navigate,
    runWorkforceDemo,
    resetWorkforceDemo,
    workforceDemoRunning,
    workforceDemoPhase,
    perspective,
  } = useEnterprise();
  const { t, tv } = useEnterpriseLocale();
  const { perspectiveConfig, workers, workforceMemoryAdded } = useWorkforceData();

  const demoSteps = ([1, 2, 3, 4] as const).map((id) => ({
    id,
    label: t("workforce", `demoSteps.${id}.label`),
    detail: t("workforce", `demoSteps.${id}.detail`),
  }));

  const demoStep =
    workforceDemoPhase === "idle"
      ? 0
      : workforceDemoPhase === "analyst_working"
        ? 1
        : workforceDemoPhase === "memory_updated"
          ? 2
          : workforceDemoPhase === "ceo_ready" || workforceDemoPhase === "complete"
            ? workforceDemoPhase === "complete"
              ? 4
              : 3
            : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3.5" />
            {tv("digitalWorkforce")}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("workforce", "hubDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runWorkforceDemo}
            disabled={workforceDemoRunning}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {workforceDemoRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            {workforceDemoRunning ? t("workforce", "demoRunning") : t("workforce", "playDemo")}
          </button>
          {workforceDemoPhase === "complete" ? (
            <button
              type="button"
              onClick={resetWorkforceDemo}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <RotateCcw className="size-4" />
              {t("workforce", "reset")}
            </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {workforceDemoRunning || workforceDemoPhase !== "idle" ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <EnterpriseGlassCard padding="md" className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("workforce", "demoFlowTitle")}
              </p>
              <div className="grid gap-2 sm:grid-cols-4">
                {demoSteps.map((step) => {
                  const active = demoStep === step.id;
                  const done = demoStep > step.id;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "rounded-xl border p-3 transition-all duration-300",
                        active
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : done
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-border/30 bg-muted/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {done ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : active ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                            {step.id}
                          </span>
                        )}
                        <span className="text-xs font-semibold">{step.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </EnterpriseGlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {workers
          .filter((w) => w.visible)
          .map((worker) => (
            <EnterpriseGlassCard
              key={worker.id}
              padding="md"
              className={cn(
                "transition-all duration-300",
                worker.status === "working" && "border-primary/40 bg-primary/5 ring-1 ring-primary/20",
                worker.status === "completed" && "border-emerald-500/30 bg-emerald-500/5",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                    worker.accent,
                  )}
                >
                  <Bot className="size-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{worker.name}</p>
                    {worker.status === "working" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <Loader2 className="size-2.5 animate-spin" />
                        {t("workforce", "status.working")}
                      </span>
                    ) : null}
                    {worker.status === "completed" ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {t("workforce", "status.done")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{worker.specialty}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {worker.description}
                  </p>
                  {worker.id === "proposal-analyst" &&
                  worker.status === "working" &&
                  perspective === "sales" ? (
                    <p className="mt-2 text-xs font-medium text-primary">
                      {t("workforce", "workers.proposal-analyst.workingTask")}
                    </p>
                  ) : null}
                </div>
              </div>
            </EnterpriseGlassCard>
          ))}
      </div>

      {workforceMemoryAdded ? (
        <FadeIn>
          <EnterpriseGlassCard
            padding="md"
            className="flex flex-wrap items-center justify-between gap-4 border-emerald-500/20 bg-emerald-500/5"
          >
            <div className="flex items-center gap-3">
              <Brain className="size-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {t("workforce", "memoryBannerTitle")}
                </p>
                <p className="text-xs text-emerald-800/80">
                  {t("workforce", "memoryBannerDesc")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate({ view: "memory", memoryTab: "decisions" })}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:underline"
            >
              {t("workforce", "viewKnowledge")} <ArrowRight className="size-4" />
            </button>
          </EnterpriseGlassCard>
        </FadeIn>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        {t("workforce", "hubFootnote", { role: perspectiveConfig.label })}
      </p>
    </div>
  );
}