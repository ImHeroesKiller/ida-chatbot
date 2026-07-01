"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, MessagesSquare } from "lucide-react";

import { AGENT_COPY } from "@/lib/agent/content";
import type { Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  locale: Locale;
  expanded?: boolean;
  onExpand?: () => void;
}

const NAV_ITEMS = [
  { href: "/chat", labelKey: "navChat" as const, icon: MessagesSquare },
  { href: "/agent", labelKey: "navAgent" as const, icon: Bot },
] as const;

export function SidebarNav({
  locale,
  expanded = true,
  onExpand,
}: SidebarNavProps) {
  const pathname = usePathname();
  const copy = AGENT_COPY[locale];

  return (
    <nav
      className={cn(
        "flex gap-1",
        expanded ? "flex-row px-2" : "flex-col px-1.5",
      )}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const label = copy[item.labelKey];

        return (
          <Link
            key={item.href}
            href={item.href}
            title={label}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              if (!expanded) onExpand?.();
            }}
            className={cn(
              "flex items-center rounded-lg text-xs font-medium transition-colors",
              expanded
                ? "flex-1 justify-center gap-1.5 px-2 py-2"
                : "justify-center p-2",
              isActive
                ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {expanded && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}