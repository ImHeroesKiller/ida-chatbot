"use client";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "./enterprise-context";

export function CoreMessageBanner() {
  const { view } = useEnterprise();
  const { t } = useEnterpriseLocale();
  const message =
    view === "workforce" || view === "executive-brief"
      ? t("enterprise", "slogan.workforce")
      : t("enterprise", "slogan.core");

  return (
    <div className="mb-6 rounded-xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
      <p className="text-center text-[13px] font-medium leading-snug text-foreground/90 sm:text-sm">
        {message}
      </p>
    </div>
  );
}