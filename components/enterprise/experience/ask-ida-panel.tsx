"use client";

import { useState } from "react";
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterpriseData } from "./use-enterprise-data";

type SuggestedAction = {
  action: string;
  owner: "Human Workforce" | "Digital Workforce" | "Either";
  priority?: "high" | "medium" | "low";
};

type StructuredAnswer = {
  analysis: string;
  recommendation: string;
  risks?: string;
  suggestedActions: SuggestedAction[];
};

type AskIdaApiResponse = {
  success?: boolean;
  answer?: string;
  structured?: StructuredAnswer | null;
  hasLiveData?: boolean;
  source?: "llm" | "heuristic" | "empty";
  error?: string;
};

function ownerIcon(owner: SuggestedAction["owner"]) {
  if (owner === "Digital Workforce") return Bot;
  if (owner === "Human Workforce") return Users;
  return Sparkles;
}

export function AskIdaPanel({ compact = false }: { compact?: boolean }) {
  const { live } = useEnterpriseData();
  const { locale, t, messages } = useEnterpriseLocale();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [structured, setStructured] = useState<StructuredAnswer | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [hasLiveData, setHasLiveData] = useState(false);
  const [loading, setLoading] = useState(false);

  const prompts = (messages.ask.suggestions as string[]) ?? [];

  async function ask(question: string) {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setStructured(null);
    setSource(null);
    try {
      const res = await fetch("/api/demo/ask-ida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), locale }),
      });
      const data = (await res.json()) as AskIdaApiResponse;
      if (!res.ok && data.error) {
        setAnswer(data.error);
        return;
      }
      setAnswer(data.answer ?? data.error ?? t("ask", "noResponse"));
      setStructured(data.structured ?? null);
      setSource(data.source ?? null);
      setHasLiveData(Boolean(data.hasLiveData));
    } catch {
      setAnswer(t("ask", "errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseGlassCard padding={compact ? "md" : "lg"}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MessageCircle className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{t("ask", "title")}</h2>
        <span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
          Decision OS
        </span>
        {live || hasLiveData ? (
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {t("ask", "liveData")}
          </span>
        ) : (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t("ask", "demoMemory")}
          </span>
        )}
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        {t("ask", "subtitle")}
      </p>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && ask(q)}
          placeholder={t("ask", "placeholder")}
          disabled={loading}
          className="flex-1 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => ask(q)}
          disabled={loading || !q.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          aria-label="Ask IDA"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>

      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {prompts.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s);
                void ask(s);
              }}
              disabled={loading}
              className="rounded-full border border-border/40 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          {t("ask", "thinking")}
        </div>
      ) : null}

      {structured && !loading ? (
        <div className="mt-4 space-y-3">
          {source === "llm" ? (
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary/80">
              {t("ask", "poweredByLlm")}
            </p>
          ) : null}

          <section className="rounded-xl border border-border/30 bg-muted/15 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("ask", "labels.analysis")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
              {structured.analysis}
            </p>
          </section>

          <section className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {t("ask", "labels.recommendation")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
              {structured.recommendation}
            </p>
          </section>

          {structured.risks ? (
            <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <ShieldAlert className="size-3.5" />
                {t("ask", "labels.risks")}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                {structured.risks}
              </p>
            </section>
          ) : null}

          {structured.suggestedActions.length > 0 ? (
            <section className="rounded-xl border border-border/30 bg-background/50 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("ask", "labels.actions")}
              </h3>
              <ul className="mt-2 space-y-2">
                {structured.suggestedActions.map((item, i) => {
                  const Icon = ownerIcon(item.owner);
                  return (
                    <li
                      key={`${item.action}-${i}`}
                      className="flex items-start gap-2.5 rounded-lg border border-border/25 px-3 py-2"
                    >
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">{item.action}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {item.owner}
                          {item.priority ? ` · ${item.priority}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      ) : answer && !loading ? (
        <div className="mt-4 rounded-xl border border-border/30 bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      ) : null}
    </EnterpriseGlassCard>
  );
}
