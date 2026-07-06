import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EnterpriseGlassCardProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClass = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function EnterpriseGlassCard({
  children,
  className,
  padding = "md",
}: EnterpriseGlassCardProps) {
  return (
    <div
      className={cn(
        "ida-glass-subtle rounded-2xl border border-border/40 shadow-sm",
        paddingClass[padding],
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
      className={cn("h-px w-full bg-border/50", className)}
    />
  );
}