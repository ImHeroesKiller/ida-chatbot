"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { EnterpriseGlassCard } from "@/components/enterprise/enterprise-glass-card";
import { FadeIn } from "@/components/enterprise/enterprise-motion";

import { HOW_IDA_THINKS_STEPS } from "../positioning-data";

export function HowIdaThinks() {
  return (
    <FadeIn delay={0.08}>
      <EnterpriseGlassCard padding="lg">
        <div className="mb-8">
          <h2 className="text-lg font-semibold tracking-tight">How IDA works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From what happens in your business to what leaders need to decide — one clear path.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
          {HOW_IDA_THINKS_STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center gap-2 lg:flex-col lg:gap-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="enterprise-card-premium flex flex-1 flex-col rounded-xl border border-border/40 p-4 lg:min-h-[120px]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold">{step.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
              {index < HOW_IDA_THINKS_STEPS.length - 1 ? (
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground/50 lg:block" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-full lg:block">
          <motion.div
            className="h-1 rounded-full bg-gradient-to-r from-muted via-primary/60 to-primary"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
      </EnterpriseGlassCard>
    </FadeIn>
  );
}