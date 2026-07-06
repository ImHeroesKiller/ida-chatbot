"use client";

import { Check, Minus } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

type CopilotData = {
  title: string;
  subtitle: string;
  headers: { capability: string; copilot: string; ida: string };
  rows: Array<{ capability: string; copilot: string; ida: string }>;
};

export function WhyNotCopilot() {
  const { messages } = useEnterpriseLocale();
  const copilot = messages.narrative.copilot as CopilotData;

  return (
    <FadeIn delay={0.16}>
      <EnterpriseGlassCard padding="lg">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">{copilot.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copilot.subtitle}</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-semibold">{copilot.headers.capability}</th>
                <th className="px-4 py-3 font-semibold">{copilot.headers.copilot}</th>
                <th className="px-4 py-3 font-semibold text-primary">{copilot.headers.ida}</th>
              </tr>
            </thead>
            <tbody>
              {copilot.rows.map((row, index) => (
                <tr
                  key={row.capability}
                  className={cn(
                    "transition-colors duration-200 hover:bg-muted/15",
                    index < copilot.rows.length - 1 && "border-b border-border/30",
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