import { Globe2, Lock, Timer, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

const VISUALS = {
  workflow: {
    icon: Workflow,
    gradient: "from-sky-500/20 via-blue-500/10 to-transparent",
    accent: "text-sky-600 dark:text-sky-400",
  },
  export: {
    icon: Timer,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    accent: "text-amber-600 dark:text-amber-400",
  },
  security: {
    icon: Lock,
    gradient: "from-emerald-500/20 via-green-500/10 to-transparent",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  language: {
    icon: Globe2,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    accent: "text-violet-600 dark:text-violet-400",
  },
} as const;

export type BenefitVisualKey = keyof typeof VISUALS;

interface LandingBenefitVisualProps {
  variant: BenefitVisualKey;
  className?: string;
}

export function LandingBenefitVisual({
  variant,
  className,
}: LandingBenefitVisualProps) {
  const { icon: Icon, gradient, accent } = VISUALS[variant];

  return (
    <div
      className={cn(
        "relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-card sm:size-24",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          gradient,
        )}
      />
      <div className="absolute -right-3 -top-3 size-12 rounded-full bg-primary/8 blur-xl" />
      <Icon className={cn("relative size-9 sm:size-10", accent)} strokeWidth={1.5} />
    </div>
  );
}