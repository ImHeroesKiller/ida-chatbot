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
        "sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl backdrop-saturate-150",
        className,
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-lg font-semibold tracking-tight text-primary-foreground shadow-sm shadow-primary/20">
            I
          </div>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold tracking-[-0.02em]">
              IDA
            </div>
            <div className="-mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              Enterprise OS
            </div>
          </div>
          <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-[11px] font-medium tracking-wide text-emerald-700 dark:text-emerald-400 sm:inline">
            Investor Demo
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/chat"
            className="text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            ← Back to Chat
          </Link>
          <Button
            size="sm"
            className="h-9 rounded-full px-6 text-[13px] font-medium shadow-sm shadow-primary/15 transition-all duration-200 hover:shadow-md hover:shadow-primary/20"
          >
            Book Enterprise Demo
          </Button>
        </div>
      </div>
    </header>
  );
}