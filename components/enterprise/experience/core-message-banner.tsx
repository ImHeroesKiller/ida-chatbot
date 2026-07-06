"use client";

import { IDA_CORE_MESSAGE } from "./narrative";

export function CoreMessageBanner() {
  return (
    <div className="mb-6 rounded-xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
      <p className="text-center text-[13px] font-medium leading-snug text-foreground/90 sm:text-sm">
        {IDA_CORE_MESSAGE}
      </p>
    </div>
  );
}