"use client";

import { Check, Minus } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { cn } from "@/lib/utils";

import { COPILOT_COMPARISON } from "../positioning-data";

export function WhyNotCopilot() {
  return (
    <FadeIn delay={0.16}>
      <EnterpriseGlassCard padding="lg">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Why not Copilot?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copilot assists individuals. IDA operates at organizational scale.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Capability</th>
                <th className="px-4 py-3 font-semibold">Microsoft Copilot</th>
                <th className="px-4 py-3 font-semibold text-primary">IDA Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COPILOT_COMPARISON.map((row, index) => (
                <tr
                  key={row.capability}
                  className={cn(
                    "transition-colors duration-200 hover:bg-muted/15",
                    index < COPILOT_COMPARISON.length - 1 && "border-b border-border/30",
                  )}
                >
                  <td className="px-4 py-3.5 font-medium">{row.capability}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Minus className="mt-0.5 size-3.5 shrink-0 opacity-50" />
                      <span className="text-xs leading-relaxed sm:text-sm">{row.copilot}</span>
                    </div>
                  </td>
                  <td className="bg-primary/[0.03] px-4 py-3.5">
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                      <span className="text-xs leading-relaxed sm:text-sm">{row.ida}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EnterpriseGlassCard>
    </FadeIn>
  );
}