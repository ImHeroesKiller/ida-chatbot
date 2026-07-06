import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EnterpriseGlassCardProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
};

const paddingClass = {
  none: "",
  sm: "p-5 sm:p-6",
  md: "p-6 sm:p-7",
  lg: "p-7 sm:p-9",
};

export function EnterpriseGlassCard({
  children,
  className,
  padding = "md",
  interactive = false,
}: EnterpriseGlassCardProps) {
  return (
    <div
      className={cn(
        "enterprise-card-premium rounded-2xl",
        paddingClass[padding],
        interactive && "ida-hover-lift cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EnterpriseSectionDivider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn(
        "h-px w-full bg-gradient-to-r from-transparent via-border/60 to-transparent",
        className,
      )}
    />
  );
}