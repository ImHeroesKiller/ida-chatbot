"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, FileText, FolderKanban, Mail } from "lucide-react";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import type { OrganizationNode } from "@/components/enterprise/types";
import { Button } from "@/components/ui/button";

type CurrentContextPanelProps = {
  node: OrganizationNode;
};

const derivedItems = [
  {
    key: "comm" as const,
    label: "Communications",
    icon: Mail,
    tone: "text-blue-600 bg-blue-500/10 ring-blue-500/15",
  },
  {
    key: "meetings" as const,
    label: "Meetings",
    icon: Calendar,
    tone: "text-violet-600 bg-violet-500/10 ring-violet-500/15",
  },
  {
    key: "invoices" as const,
    label: "Invoices",
    icon: FileText,
    tone: "text-amber-600 bg-amber-500/10 ring-amber-500/15",
  },
  {
    key: "projects" as const,
    label: "Projects",
    icon: FolderKanban,
    tone: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/15",
  },
];

const EASE = [0.23, 1, 0.32, 1] as const;

export function CurrentContextPanel({ node }: CurrentContextPanelProps) {
  return (
    <EnterpriseGlassCard
      padding="lg"
      className="flex h-full min-h-0 flex-col gap-9"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="space-y-2.5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Current Context
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
            {node.name}
          </h2>
          <p className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
            {node.role} • {node.health}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Derived From
        </p>
        <ul className="space-y-4">
          {derivedItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: EASE, delay: index * 0.05 }}
                className="flex items-center justify-between gap-3 rounded-xl px-1 py-0.5 transition-colors duration-200 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex size-9 items-center justify-center rounded-xl ring-1 ${item.tone}`}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-[13px] font-medium">{item.label}</span>
                </div>
                <span className="text-[15px] font-semibold tabular-nums tracking-tight">
                  {node[item.key]}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto pt-3">
        <Button className="h-12 w-full rounded-2xl text-[13px] font-medium shadow-sm shadow-primary/15 transition-all duration-200 hover:shadow-md hover:shadow-primary/20">
          Ask IDA
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </EnterpriseGlassCard>
  );
}