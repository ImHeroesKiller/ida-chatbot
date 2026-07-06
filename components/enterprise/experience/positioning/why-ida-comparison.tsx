"use client";

import { Check, X } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { TRADITIONAL_AI_VS_IDA } from "../positioning-data";

export function WhyIdaComparison() {
  return (
    <FadeIn>
      <EnterpriseGlassCard padding="lg">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Why IDA?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Traditional AI answers questions. IDA understands your organization.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/40">
          <div className="grid min-w-[640px] grid-cols-[1fr_1fr_1fr] border-b border-border/40 bg-muted/30 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <div className="px-4 py-3">Dimension</div>
            <div className="border-l border-border/40 px-4 py-3">Traditional AI</div>
            <div className="border-l border-border/40 px-4 py-3 text-primary">IDA</div>
          </div>
          {TRADITIONAL_AI_VS_IDA.map((row, index) => (
            <div
              key={row.dimension}
              className={cn(
                "grid min-w-[640px] grid-cols-[1fr_1fr_1fr] text-sm transition-colors duration-200 hover:bg-muted/15",
                index < TRADITIONAL_AI_VS_IDA.length - 1 && "border-b border-border/30",
              )}
            >
              <div className="px-4 py-4 font-medium">{row.dimension}</div>
              <div className="flex gap-2 border-l border-border/30 px-4 py-4 text-muted-foreground">
                <X className="mt-0.5 size-3.5 shrink-0 text-red-500/70" strokeWidth={2} />
                <span className="text-xs leading-relaxed sm:text-sm">{row.traditional}</span>
              </div>
              <div className="flex gap-2 border-l border-border/30 bg-primary/[0.03] px-4 py-4">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                <span className="text-xs leading-relaxed sm:text-sm">{row.ida}</span>
              </div>
            </div>
          ))}
        </div>
      </EnterpriseGlassCard>
    </FadeIn>
  );
}