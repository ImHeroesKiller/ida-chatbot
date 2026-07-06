"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Database,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { PageHeader } from "../page-header";

type HealthPayload = {
  success: boolean;
  status: string;
  timestamp: string;
  version: string;
  checks: Record<string, string>;
  eslCounts?: Record<string, number>;
  requestId: string;
};

type EslDebugPayload = {
  success: boolean;
  hydrated: boolean;
  storePath: string;
  counts: Record<string, number>;
  lastSync: string | null;
  organizations: Array<{ id: string; name: string; accountId?: string }>;
  communications: number;
  graph: { nodeCount: number; edgeCount: number };
  attentionItems: number;
  requestId: string;
};

function StatusBadge({ value }: { value: string }) {
  const ok = value === "ok" || value === "configured";
  return (
    <span
      className={
        ok
          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700"
          : "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700"
      }
    >
      {value}
    </span>
  );
}

export function DebugDashboardView() {
  const { t } = useEnterpriseLocale();
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [esl, setEsl] = useState<EslDebugPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, eslRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/debug/esl"),
      ]);
      const healthData = await healthRes.json();
      const eslData = await eslRes.json();
      setHealth(healthData);
      setEsl(eslData.success ? eslData : null);
      if (!healthRes.ok && !healthData.success) {
        setError(healthData.message ?? "Health check failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diagnostics failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("views", "debug.eyebrow")}
        title={t("views", "debug.title")}
        description={t("views", "debug.description")}
        action={
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {t("views", "debug.refresh")}
          </button>
        }
      />

      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <EnterpriseGlassCard padding="md" className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t("views", "debug.health")}</h2>
          </div>
          {loading && !health ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : health ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.status")}</dt>
                <dd><StatusBadge value={health.status} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.version")}</dt>
                <dd className="font-mono text-xs">{health.version}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.checked")}</dt>
                <dd className="text-xs">{new Date(health.timestamp).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.requestId")}</dt>
                <dd className="font-mono text-xs">{health.requestId}</dd>
              </div>
              {Object.entries(health.checks).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="capitalize text-muted-foreground">{key}</dt>
                  <dd><StatusBadge value={value} /></dd>
                </div>
              ))}
            </dl>
          ) : null}
        </EnterpriseGlassCard>

        <EnterpriseGlassCard padding="md" className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t("views", "debug.eslStore")}</h2>
          </div>
          {loading && !esl ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : esl ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.hydrated")}</dt>
                <dd><StatusBadge value={esl.hydrated ? "ok" : "empty"} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.storePath")}</dt>
                <dd className="font-mono text-xs">{esl.storePath}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.graph")}</dt>
                <dd className="text-xs">
                  {t("views", "debug.nodesEdges", { nodes: esl.graph.nodeCount, edges: esl.graph.edgeCount })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.attentionItems")}</dt>
                <dd>{esl.attentionItems}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("views", "debug.requestId")}</dt>
                <dd className="font-mono text-xs">{esl.requestId}</dd>
              </div>
              {Object.entries(esl.counts).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="capitalize text-muted-foreground">{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{t("views", "debug.eslUnavailable")}</p>
          )}
        </EnterpriseGlassCard>
      </div>

      {esl && esl.organizations.length > 0 ? (
        <EnterpriseGlassCard padding="md" className="space-y-3">
          <h2 className="text-sm font-semibold">{t("views", "debug.orgsInEsl")}</h2>
          <ul className="space-y-2 text-sm">
            {esl.organizations.map((org) => (
              <li key={org.id} className="flex justify-between gap-4 rounded-lg bg-muted/30 px-3 py-2">
                <span>{org.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {org.accountId ?? org.id.slice(0, 8)}
                </span>
              </li>
            ))}
          </ul>
        </EnterpriseGlassCard>
      ) : null}

      <EnterpriseGlassCard padding="md" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">{t("views", "debug.gmailOAuth")}</p>
            <p className="text-xs text-muted-foreground">
              {health?.checks.gmail === "configured"
                ? t("views", "debug.gmailConfigured")
                : t("views", "debug.gmailNotConfigured")}
            </p>
          </div>
        </div>
        <Link
          href="/docs/setup/gmail"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted/50"
        >
          {t("views", "debug.setupWizard")}
          <ExternalLink className="size-3.5" />
        </Link>
      </EnterpriseGlassCard>

      <p className="text-center text-xs text-muted-foreground">
        {t("views", "debug.apiEndpoints")} <code className="rounded bg-muted px-1">GET /api/health</code> ·{" "}
        <code className="rounded bg-muted px-1">GET /api/debug/esl</code>
      </p>
    </div>
  );
}