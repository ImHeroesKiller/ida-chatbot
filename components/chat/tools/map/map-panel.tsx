"use client";

import { Map, PanelRightClose } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MapPanelProps {
  locale: Locale;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

export function MapPanel({
  locale,
  onClose,
  className,
  embedded = false,
}: MapPanelProps) {
  const copy = COPY[locale];

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-background",
        embedded ? "w-full" : "relative z-10 w-[min(100%,22rem)] shrink-0",
        className,
      )}
      aria-label={copy.toolsMap}
      role="complementary"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Map className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {copy.toolsMap}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.rightSidebarClose}
          title={copy.rightSidebarClose}
          className="h-8 w-8 shrink-0"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/15 px-4 py-8 text-center">
            <Map className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground/90">
              {copy.toolsComingSoon}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              {copy.mapPlaceholderDesc}
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}