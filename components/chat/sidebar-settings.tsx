"use client";

import { Moon, Settings2, Sun, Trash2 } from "lucide-react";

import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { useUiPrefs } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

interface SidebarSettingsProps {
  locale: Locale;
  expanded: boolean;
  onClearAllChats: () => void;
}

export function SidebarSettings({
  locale,
  expanded,
  onClearAllChats,
}: SidebarSettingsProps) {
  const copy = COPY[locale];
  const { theme, hydrated: themeHydrated, toggleTheme } = useThemeContext();
  const { prefs, toggleCompactMode } = useUiPrefs();

  if (!expanded) {
    return (
      <div className="shrink-0 space-y-1 border-t p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-9 w-full"
          onClick={toggleTheme}
          title={copy.toggleTheme}
          aria-label={copy.toggleTheme}
        >
          {themeHydrated && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t bg-muted/10 p-2.5 dark:bg-muted/5">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-muted-foreground">
        <Settings2 className="h-3.5 w-3.5" />
        {copy.settings}
      </div>

      <div className="space-y-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-2 text-xs"
          onClick={toggleTheme}
        >
          {themeHydrated && theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          {copy.toggleTheme}
        </Button>

        <label className="flex h-8 cursor-pointer items-center justify-between gap-2 rounded-lg px-2 text-xs hover:bg-muted/50">
          <span>{copy.compactMode}</span>
          <input
            type="checkbox"
            checked={prefs.compactMode}
            onChange={toggleCompactMode}
            className="h-3.5 w-3.5 rounded border-input accent-primary"
          />
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-full justify-start gap-2 text-xs text-destructive",
            "hover:bg-destructive/10 hover:text-destructive",
          )}
          onClick={onClearAllChats}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {copy.clearAllChats}
        </Button>
      </div>
    </div>
  );
}