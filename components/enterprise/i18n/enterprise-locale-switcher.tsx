"use client";

import { cn } from "@/lib/utils";
import type { EnterpriseLocale } from "@/lib/enterprise/i18n/types";

import { useEnterpriseLocale } from "./enterprise-locale-provider";

const MODES: Array<{
  locale: EnterpriseLocale;
  labelKey: "presentation" | "internal";
  hintKey: "presentationHint" | "internalHint";
}> = [
  { locale: "en", labelKey: "presentation", hintKey: "presentationHint" },
  { locale: "id", labelKey: "internal", hintKey: "internalHint" },
];

type EnterpriseLocaleSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function EnterpriseLocaleSwitcher({
  className,
  compact = false,
}: EnterpriseLocaleSwitcherProps) {
  const { locale, setLocale, t } = useEnterpriseLocale();

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <div
        className="inline-flex items-center rounded-lg border border-border/50 bg-muted/20 p-0.5"
        role="group"
        aria-label="Language mode"
      >
        {MODES.map((mode) => (
          <button
            key={mode.locale}
            type="button"
            onClick={() => setLocale(mode.locale)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200",
              locale === mode.locale
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            aria-pressed={locale === mode.locale}
            title={t("enterprise", `modes.${mode.hintKey}`)}
          >
            {t("enterprise", `modes.${mode.labelKey}`)}
          </button>
        ))}
      </div>
      {!compact ? (
        <p className="text-[10px] text-muted-foreground">
          {t("enterprise", `modes.${locale === "en" ? "presentationHint" : "internalHint"}`)}
        </p>
      ) : null}
    </div>
  );
}