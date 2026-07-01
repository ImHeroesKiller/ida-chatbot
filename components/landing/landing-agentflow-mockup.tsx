import { Bot, FileText, GitBranch, Sparkles } from "lucide-react";

export function LandingAgentFlowMockup() {
  return (
    <figure className="relative mx-auto w-full max-w-lg">
      <div className="relative" aria-hidden>
        <div className="mx-auto w-[92%] rounded-t-2xl border border-b-0 border-border/60 bg-muted/40 px-3 py-2">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-border/80" />
        </div>

        <div className="overflow-hidden rounded-b-2xl border border-border/60 bg-[#0f1117] shadow-2xl shadow-primary/15">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Bot className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                AgentFlow — Document Pipeline
              </p>
              <p className="text-[10px] text-white/50">Automated workflow</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Running
            </span>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            {[
              { icon: FileText, label: "Input", detail: "Memo draft" },
              { icon: Sparkles, label: "IDA AI", detail: "Generate doc" },
              { icon: GitBranch, label: "Export", detail: "PDF + approval" },
            ].map((step, index) => (
              <div key={step.label} className="contents">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <step.icon className="size-4" />
                  </div>
                  <p className="text-[11px] font-semibold text-white">{step.label}</p>
                  <p className="mt-0.5 text-[10px] text-white/55">{step.detail}</p>
                </div>
                {index < 2 ? (
                  <div
                    className="hidden h-px w-6 bg-gradient-to-r from-primary/40 to-primary/10 sm:block"
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center justify-between text-[10px] text-white/45">
              <span>Step 2 of 3 — Generating worksheet</span>
              <span className="font-medium text-primary">68%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[68%] rounded-full bg-primary" />
            </div>
          </div>
        </div>

        <div className="mx-auto -mt-1 h-3 w-[98%] rounded-b-xl bg-border/40" />
      </div>
      <figcaption className="sr-only">
        Laptop mockup showing AgentFlow automating document generation workflow.
      </figcaption>
    </figure>
  );
}