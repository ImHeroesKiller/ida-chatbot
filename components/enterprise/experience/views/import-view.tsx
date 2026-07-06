"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";

import { AskIdaPanel } from "../ask-ida-panel";
import { useEnterprise } from "../enterprise-context";
import { IDA_CORE_MESSAGE } from "../narrative";
import { RealityConnectPanel } from "../reality-connect-panel";
import { PageHeader } from "../page-header";

export function ImportView() {
  const { navigate, gmailNotice, clearGmailNotice } = useEnterprise();

  return (
    <div className="space-y-8">
      {gmailNotice ? (
        <div
          className={
            gmailNotice.tone === "error"
              ? "rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium">{gmailNotice.message}</p>
              <p className="text-xs opacity-90">{gmailNotice.suggestion}</p>
              {gmailNotice.requestId ? (
                <p className="font-mono text-[11px] opacity-75">Ref: {gmailNotice.requestId}</p>
              ) : null}
              {gmailNotice.tone === "error" ? (
                <Link href="/docs/setup/gmail" className="text-xs font-medium text-primary hover:underline">
                  Open Gmail setup wizard →
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={clearGmailNotice}
              className="shrink-0 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <PageHeader
        eyebrow="Reality First"
        title="Connect your organization"
        description={`${IDA_CORE_MESSAGE} Start by importing real emails and documents — the dashboard updates in under 2 minutes.`}
      />

      <RealityConnectPanel />
      <AskIdaPanel />

      <FadeIn delay={0.1}>
        <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            After import → check Executive Brief and Timeline for live updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ view: "executive-brief" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Executive Brief <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: "timeline" })}
              className="enterprise-text-link inline-flex items-center gap-2 text-sm font-medium"
            >
              Timeline <ArrowRight className="size-4" />
            </button>
          </div>
        </EnterpriseGlassCard>
      </FadeIn>
    </div>
  );
}