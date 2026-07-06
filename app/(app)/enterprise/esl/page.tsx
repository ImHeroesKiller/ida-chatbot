"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  EnterpriseGlassCard,
  EnterpriseSectionDivider,
} from "@/components/enterprise/enterprise-glass-card";

type PipelineResponse = {
  success: boolean;
  processed?: number;
  mode?: string;
  overview?: {
    attentionItems: Array<{
      title: string;
      organization?: string;
      type: string;
      priority?: string;
    }>;
    graph: { stats: { nodeCount: number; edgeCount: number } };
    esl: { counts: Record<string, number> };
    organizationSummaries: Array<{
      organization: string;
      communications: number;
      artifacts: number;
    }>;
  };
  error?: string;
};

export default function EnterpriseESLDemoPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [queryResult, setQueryResult] = useState<unknown>(null);

  async function runDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/esl/demo", { method: "POST" });
      const json = (await res.json()) as PipelineResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  async function queryPLN() {
    const res = await fetch("/api/esl/query?organization=PLN");
    setQueryResult(await res.json());
  }

  return (
    <div className="min-h-dvh overflow-y-auto bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">Sprint 1 — Representation Layer</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Enterprise Semantic Layer Demo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gmail → Observation → ESL → Identity → Graph → Query
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={runDemo} disabled={loading}>
            {loading ? "Running…" : "Run Demo Pipeline"}
          </Button>
          <Button variant="outline" onClick={queryPLN}>
            Query PLN
          </Button>
        </div>

        {data?.success && data.overview ? (
          <>
            <EnterpriseSectionDivider />
            <div className="grid gap-4 sm:grid-cols-3">
              <EnterpriseGlassCard>
                <div className="text-2xl font-semibold">{data.processed}</div>
                <p className="text-sm text-muted-foreground">Emails processed</p>
              </EnterpriseGlassCard>
              <EnterpriseGlassCard>
                <div className="text-2xl font-semibold">
                  {data.overview.graph.stats.nodeCount}
                </div>
                <p className="text-sm text-muted-foreground">Graph nodes</p>
              </EnterpriseGlassCard>
              <EnterpriseGlassCard>
                <div className="text-2xl font-semibold">
                  {data.overview.esl.counts.organizations}
                </div>
                <p className="text-sm text-muted-foreground">Organizations</p>
              </EnterpriseGlassCard>
            </div>

            <EnterpriseGlassCard padding="lg" className="space-y-4">
              <h2 className="font-semibold">Attention items</h2>
              <ul className="space-y-3">
                {data.overview.attentionItems.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-border/40 px-4 py-3 text-sm"
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground">
                      {item.organization} · {item.type} · {item.priority}
                    </div>
                  </li>
                ))}
              </ul>
            </EnterpriseGlassCard>

            <EnterpriseGlassCard padding="lg">
              <h2 className="mb-3 font-semibold">Organization summaries</h2>
              <pre className="overflow-x-auto text-xs text-muted-foreground">
                {JSON.stringify(data.overview.organizationSummaries, null, 2)}
              </pre>
            </EnterpriseGlassCard>
          </>
        ) : null}

        {queryResult ? (
          <EnterpriseGlassCard padding="lg">
            <h2 className="mb-3 font-semibold">PLN query result</h2>
            <pre className="overflow-x-auto text-xs text-muted-foreground">
              {JSON.stringify(queryResult, null, 2)}
            </pre>
          </EnterpriseGlassCard>
        ) : null}

        {data?.error ? (
          <p className="text-sm text-destructive">{data.error}</p>
        ) : null}
      </div>
    </div>
  );
}