"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Handshake,
  Mail,
  Scale,
  Target,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/enterprise/enterprise-motion";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { cn } from "@/lib/utils";

import { PLN_EVERYTHING_IDA_KNOWS } from "../positioning-data";

const CATEGORY_META = {
  people: { icon: Users, color: "text-blue-600 bg-blue-500/10" },
  meetings: { icon: Calendar, color: "text-violet-600 bg-violet-500/10" },
  emails: { icon: Mail, color: "text-sky-600 bg-sky-500/10" },
  projects: { icon: Target, color: "text-emerald-600 bg-emerald-500/10" },
  risks: { icon: AlertTriangle, color: "text-amber-600 bg-amber-500/10" },
  decisions: { icon: Scale, color: "text-indigo-600 bg-indigo-500/10" },
  commitments: { icon: Handshake, color: "text-rose-600 bg-rose-500/10" },
} as const;

type CategoryKey = keyof typeof CATEGORY_META;

type PlnCategory = {
  label: string;
  items: Array<{ title: string; detail: string }>;
};

type PlnWowData = {
  eyebrow: string;
  title: string;
  recordsSubtitle: string;
  synthesizedBadge: string;
  account: string;
  lastSynthesizedValue: string;
  categories: Record<CategoryKey, PlnCategory>;
};

export function OrganizationMemoryWow() {
  const { t, messages } = useEnterpriseLocale();
  const plnWow = messages.narrative.plnWow as PlnWowData;
  const counts = PLN_EVERYTHING_IDA_KNOWS.categories;

  const categories = Object.entries(plnWow.categories) as Array<[CategoryKey, PlnCategory]>;
  const totalRecords = categories.reduce(
    (sum, [key]) => sum + (counts[key]?.count ?? 0),
    0,
  );

  return (
    <div className="mt-8">
      <FadeIn>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {plnWow.eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {t("narrative", "plnWow.title", { account: plnWow.account })}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t("narrative", "plnWow.recordsSubtitle", { count: totalRecords })}
            </p>
          </div>
          <div className="enterprise-card-premium rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground">
            <CheckCircle2 className="mr-1.5 inline size-3.5 text-emerald-500" />
            {t("narrative", "plnWow.synthesizedBadge", { date: plnWow.lastSynthesizedValue })}
          </div>
        </div>
      </FadeIn>

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map(([key, category]) => {
          const meta = CATEGORY_META[key];
          const Icon = meta.icon;
          const count = counts[key]?.count ?? category.items.length;
          return (
            <StaggerItem key={key}>
              <EnterpriseGlassCard padding="md" className="h-full">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex size-8 items-center justify-center rounded-lg", meta.color)}>
                      <Icon className="size-3.5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-sm font-semibold">{category.label}</h3>
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-bold tabular-nums"
                  >
                    {count}
                  </motion.span>
                </div>
                <ul className="space-y-2.5">
                  {category.items.map((item, i) => (
                    <li
                      key={i}
                      className="enterprise-list-item rounded-lg border border-border/25 px-3 py-2.5"
                    >
                      <p className="text-xs font-medium leading-snug">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </EnterpriseGlassCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}