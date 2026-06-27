"use client";

import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AGENT_COPY } from "@/lib/agent/content";
import type { AgentApiStatusResponse } from "@/lib/agent/config";
import type { Locale } from "@/lib/config";

interface AgentApiStatusProps {
  locale: Locale;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ready")
    return <CheckCircle2 className="size-3.5 text-green-600" />;
  if (status === "optional")
    return <Circle className="size-3.5 text-muted-foreground" />;
  return <AlertCircle className="size-3.5 text-amber-600" />;
}

export function AgentApiStatus({ locale }: AgentApiStatusProps) {
  const copy = AGENT_COPY[locale];
  const [status, setStatus] = useState<AgentApiStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/agent/status");
        if (!response.ok) {
          throw new Error(copy.apiStatusError);
        }
        const data = (await response.json()) as AgentApiStatusResponse;
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : copy.apiStatusError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [copy.apiStatusError]);

  if (loading) {
    return (
      <Card size="sm">
        <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {copy.apiStatusLoading}
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card size="sm">
        <CardContent className="py-4 text-sm text-amber-600">
          {error ?? copy.apiStatusError}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{copy.apiStatusTitle}</CardTitle>
          <Badge variant={status.ready ? "default" : "destructive"}>
            {status.ready ? copy.apiStatusReady : copy.apiStatusIncomplete}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {copy.apiStatusDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {status.services.map((service) => (
            <li
              key={service.id}
              className="flex items-start gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs"
            >
              <StatusIcon status={service.status} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{service.name}</p>
                <p className="text-muted-foreground">{service.description}</p>
                {service.envKeys.length > 0 && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                    {service.envKeys.join(", ")}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  service.status === "ready"
                    ? "default"
                    : service.status === "optional"
                      ? "secondary"
                      : "outline"
                }
                className="shrink-0 text-[10px]"
              >
                {service.status}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border bg-background px-3 py-2 font-mono text-[10px] text-muted-foreground">
          <p>POST {status.endpoints.agent}</p>
          <p>GET {status.endpoints.agentStatus}</p>
        </div>
      </CardContent>
    </Card>
  );
}