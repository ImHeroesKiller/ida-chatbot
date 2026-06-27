"use client";

import { Menu, User } from "lucide-react";
import Link from "next/link";

import { IdaLogo } from "@/components/brand/ida-logo";
import { Button } from "@/components/ui/button";
import { IDA_CONFIG } from "@/lib/config";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  openSessionsLabel: string;
  accountLabel: string;
  onOpenMobileSidebar: () => void;
}

export function ChatHeader({
  title,
  subtitle,
  openSessionsLabel,
  accountLabel,
  onOpenMobileSidebar,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b px-3 py-3 sm:gap-3 sm:px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 transition-transform hover:scale-105 active:scale-95 md:hidden"
        aria-label={openSessionsLabel}
        onClick={onOpenMobileSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <IdaLogo size="header" priority />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">
          {title || IDA_CONFIG.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>

      <Link
        href="/account"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={accountLabel}
        title={accountLabel}
      >
        <User className="h-4 w-4" />
      </Link>
    </header>
  );
}