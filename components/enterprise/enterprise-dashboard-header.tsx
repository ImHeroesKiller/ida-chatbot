import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EnterpriseDashboardHeaderProps = {
  className?: string;
};

export function EnterpriseDashboardHeader({
  className,
}: EnterpriseDashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl ida-glass-subtle",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold tracking-tighter text-primary-foreground">
            I
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              IDA
            </div>
            <div className="-mt-0.5 text-[10px] text-muted-foreground">
              Enterprise OS
            </div>
          </div>
          <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 sm:inline">
            Investor Demo
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/chat"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Chat
          </Link>
          <Button size="sm" className="rounded-full px-5">
            Book Enterprise Demo
          </Button>
        </div>
      </div>
    </header>
  );
}