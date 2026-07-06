"use client";

import {
  Brain,
  Building2,
  FolderKanban,
  Bot,
  Import,
  LayoutGrid,
  MessageCircle,
  Network,
  Search,
  Settings2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { useEnterprise } from "./enterprise-context";
import type { EnterpriseView } from "./types";

const STORY_NAV: Array<{ id: EnterpriseView; labelKey: string; icon: typeof LayoutGrid }> = [
  { id: "overview", labelKey: "nav.overview", icon: LayoutGrid },
  { id: "organization", labelKey: "nav.organization", icon: Network },
  { id: "people", labelKey: "nav.people", icon: Users },
  { id: "companies", labelKey: "nav.accounts", icon: Building2 },
  { id: "projects", labelKey: "nav.projects", icon: FolderKanban },
  { id: "memory", labelKey: "nav.knowledge", icon: Brain },
  { id: "workforce", labelKey: "nav.workforce", icon: Bot },
  { id: "ask-ida", labelKey: "nav.askIda", icon: MessageCircle },
];

const DEV_NAV: Array<{ id: EnterpriseView; labelKey: string; icon: typeof Settings2 }> = [
  { id: "import", labelKey: "nav.import", icon: Import },
  { id: "developer", labelKey: "nav.developer", icon: Settings2 },
];

type EnterpriseSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function EnterpriseSidebar({
  className = "hidden lg:flex",
  onNavigate,
}: EnterpriseSidebarProps) {
  const { view, navigate, openSearch } = useEnterprise();
  const { t } = useEnterpriseLocale();

  function handleNav(viewId: EnterpriseView) {
    navigate({ view: viewId });
    onNavigate?.();
  }

  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col border-r border-border/40 bg-background/50 backdrop-blur-xl",
        className,
      )}
    >
      <nav className="enterprise-demo-scroll flex flex-1 flex-col gap-1 p-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t("enterprise", "nav.story")}
        </p>
        {STORY_NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              {t("enterprise", item.labelKey)}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            openSearch();
            onNavigate?.();
          }}
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
        >
          <Search className="size-4 shrink-0" strokeWidth={1.75} />
          {t("enterprise", "nav.search")}
        </button>

        <p className="mb-3 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t("enterprise", "nav.developerSection")}
        </p>
        {DEV_NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              {t("enterprise", item.labelKey)}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border/40 p-4">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {t("enterprise", "sidebar.footer")}
        </p>
      </div>
    </aside>
  );
}