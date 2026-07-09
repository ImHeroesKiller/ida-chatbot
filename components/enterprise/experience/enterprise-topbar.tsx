"use client";

import Link from "next/link";
import { HelpCircle, Menu, Search } from "lucide-react";
import { useState } from "react";

import { EnterpriseLocaleSwitcher } from "@/components/enterprise/i18n/enterprise-locale-switcher";
import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { InvestorFaqTrigger } from "./investor-faq-modal";
import { CHAT_URL } from "./demo-urls";
import { useEnterprise } from "./enterprise-context";
import { EnterpriseSidebar } from "./enterprise-sidebar";

export function EnterpriseTopbar() {
  const { openSearch, openFaq, reality } = useEnterprise();
  const { t, tv } = useEnterpriseLocale();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/70 px-4 backdrop-blur-2xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 lg:hidden"
            onClick={() => setMobileNav((v) => !v)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            I
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              {t("enterprise", "topbar.title")}
            </div>
            <div className="max-w-[140px] truncate text-[10px] text-muted-foreground sm:max-w-none">
              {t("enterprise", "topbar.subtitle")}
            </div>
          </div>
          <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:inline">
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500" />
            {reality?.hasLiveData ? tv("liveData") : t("enterprise", "topbar.ready")}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <EnterpriseLocaleSwitcher compact className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => openSearch()}
            className="flex h-9 min-w-[120px] items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 sm:min-w-[200px]"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">
              {t("enterprise", "topbar.searchPlaceholder")}
            </span>
            <span className="sm:hidden">{t("enterprise", "topbar.searchShort")}</span>
            <kbd className="ml-auto hidden rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>
          <InvestorFaqTrigger />
          <button
            type="button"
            onClick={() => openFaq()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 sm:hidden"
            aria-label="Investor FAQ"
          >
            <HelpCircle className="size-5" />
          </button>
          <Link
            href="/"
            className="hidden text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            {t("enterprise", "topbar.homepage")}
          </Link>
          <Link
            href={CHAT_URL}
            className="hidden h-8 items-center justify-center rounded-full border border-border/60 bg-card/60 px-3 text-xs font-medium transition-colors hover:bg-muted/50 sm:inline-flex"
          >
            {t("enterprise", "topbar.chat")}
          </Link>
          <a
            href="mailto:aku@arywibowo.id"
            className="hidden h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            {t("enterprise", "topbar.contact")}
          </a>
        </div>
      </header>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-background shadow-xl">
            <EnterpriseSidebar
              className="flex h-full"
              onNavigate={() => setMobileNav(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
