import { ArrowRight, Calendar, FileText, FolderKanban, Mail } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import type { OrganizationNode } from "@/components/enterprise/types";
import { Button } from "@/components/ui/button";

type CurrentContextPanelProps = {
  node: OrganizationNode;
};

const derivedItems = [
  { key: "comm" as const, label: "Communications", icon: Mail, tone: "text-blue-600 bg-blue-500/10" },
  { key: "meetings" as const, label: "Meetings", icon: Calendar, tone: "text-violet-600 bg-violet-500/10" },
  { key: "invoices" as const, label: "Invoices", icon: FileText, tone: "text-amber-600 bg-amber-500/10" },
  { key: "projects" as const, label: "Projects", icon: FolderKanban, tone: "text-emerald-600 bg-emerald-500/10" },
];

export function CurrentContextPanel({ node }: CurrentContextPanelProps) {
  return (
    <EnterpriseGlassCard
      padding="lg"
      className="flex h-full min-h-0 flex-col gap-8"
    >
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Current Context
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {node.name}
        </h2>
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {node.role} • {node.health}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Derived From
        </p>
        <ul className="space-y-4">
          {derivedItems.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.key}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-8 items-center justify-center rounded-xl ${item.tone}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-medium tabular-nums">{node[item.key]}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto pt-2">
        <Button className="h-11 w-full rounded-2xl text-sm font-medium">
          Ask IDA
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </EnterpriseGlassCard>
  );
}