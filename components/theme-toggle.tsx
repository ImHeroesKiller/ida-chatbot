"use client";

import { Moon, Sun } from "lucide-react";

import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";

interface ThemeToggleProps {
  locale: Locale;
}

export function ThemeToggle({ locale }: ThemeToggleProps) {
  const { theme, hydrated, toggleTheme } = useThemeContext();
  const copy = COPY[locale];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={copy.toggleTheme}
      title={copy.toggleTheme}
      className="shrink-0 text-muted-foreground"
    >
      {hydrated && theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}