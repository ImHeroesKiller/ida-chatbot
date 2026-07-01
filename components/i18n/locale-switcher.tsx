"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = {
  id: "ID",
  en: "EN",
  zh: "中文",
};

interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-card/60 p-0.5 text-xs font-medium",
        isPending && "opacity-70",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => handleChange(code)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            code === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={code === locale}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}