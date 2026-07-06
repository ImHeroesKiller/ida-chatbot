"use client";

import {
  Brain,
  Building2,
  Calendar,
  FolderKanban,
  LayoutDashboard,
  Network,
  Search,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useEnterprise } from "./enterprise-context";
import type { EnterpriseView } from "./types";

const NAV: Array<{ id: EnterpriseView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "executive-brief", label: "Executive Brief", icon: LayoutDashboard },
  { id: "organization", label: "Organization", icon: Network },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "people", label: "People", icon: Users },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "search", label: "Search", icon: Search },
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

  function handleNav(viewId: EnterpriseView) {
    if (viewId === "search") {
      openSearch();
    } else {
      navigate({ view: viewId });
    }
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
          Platform
        </p>
        {NAV.map((item) => {
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
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border/40 p-4">
        <p className="text-[10px] text-muted-foreground">Sprint 2 • Investor Demo</p>
      </div>
    </aside>
  );
}