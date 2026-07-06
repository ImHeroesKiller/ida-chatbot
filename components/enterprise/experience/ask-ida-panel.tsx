"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";

import { useEnterpriseData } from "./use-enterprise-data";

const SUGGESTIONS = [
  "What needs attention today?",
  "What does IDA know about PLN?",
  "How many records are indexed?",
];

export function AskIdaPanel({ compact = false }: { compact?: boolean }) {
  const { live } = useEnterpriseData();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/reality/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? "No response");
    } catch {
      setAnswer("Could not reach Ask IDA. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <EnterpriseGlassCard padding={compact ? "md" : "lg"}>
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Ask IDA</h2>
        {live ? (
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Live data
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(q)}
          placeholder="Ask about imported emails and documents…"
          className="flex-1 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="button"
          onClick={() => ask(q)}
          disabled={loading}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>

      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s);
                ask(s);
              }}
              className="rounded-full border border-border/40 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {answer ? (
        <div className="mt-4 rounded-xl border border-border/30 bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      ) : null}
    </EnterpriseGlassCard>
  );
}