"use client";

import { WORKFORCE_SLOGAN } from "./digital-workforce-data";
import { useEnterprise } from "./enterprise-context";
import { IDA_CORE_MESSAGE } from "./narrative";

export function CoreMessageBanner() {
  const { view } = useEnterprise();
  const message =
    view === "workforce" || view === "executive-brief" ? WORKFORCE_SLOGAN : IDA_CORE_MESSAGE;

  return (
    <div className="mb-6 rounded-xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
      <p className="text-center text-[13px] font-medium leading-snug text-foreground/90 sm:text-sm">
        {message}
      </p>
    </div>
  );
}