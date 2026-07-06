"use client";

import { FileCheck, ShieldCheck, Users } from "lucide-react";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

const ICONS = {
  enterprise: ShieldCheck,
  human: Users,
  audit: FileCheck,
} as const;

type TrustSignal = { id: keyof typeof ICONS; label: string; detail: string };

type TrustSignalsProps = {
  compact?: boolean;
  className?: string;
};

export function TrustSignals({ compact = false, className }: TrustSignalsProps) {
  const { messages } = useEnterpriseLocale();
  const trustSignals = messages.narrative.trustSignals as TrustSignal[];

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-1 sm:grid-cols-3" : "sm:grid-cols-3",
        className,
      )}
    >
      {trustSignals.map((signal) => {
        const Icon = ICONS[signal.id];
        return (
          <div
            key={signal.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3",
              compact && "py-2.5",
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Icon className="size-3.5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold">{signal.label}</p>
              {!compact ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {signal.detail}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}