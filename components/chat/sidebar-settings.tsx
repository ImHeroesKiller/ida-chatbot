"use client";

import { Moon, Settings2, Sun, Trash2, Volume2 } from "lucide-react";

import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
  zh: "中文",
};

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
  const { prefs, setPrefs } = useVoicePrefs();

  if (!expanded) {
    return (
      <div className="shrink-0 space-y-1 border-t p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-9 w-full transition-transform hover:scale-105 active:scale-95"
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
          className="h-8 w-full justify-start gap-2 text-xs transition-colors hover:bg-muted/80"
          onClick={toggleTheme}
        >
          {themeHydrated && theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          {copy.toggleTheme}
        </Button>

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

      <div className="mt-3 space-y-2.5 rounded-lg border bg-background/60 p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Volume2 className="h-3.5 w-3.5" />
          {copy.voiceSettings}
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
          <span>{copy.autoSpeak}</span>
          <input
            type="checkbox"
            checked={prefs.autoSpeak}
            onChange={(event) =>
              setPrefs({ autoSpeak: event.target.checked })
            }
            className="h-4 w-4 rounded border-input accent-primary"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
          <span>{copy.sendAsVoiceNote}</span>
          <input
            type="checkbox"
            checked={prefs.sendAsVoiceNote}
            onChange={(event) =>
              setPrefs({ sendAsVoiceNote: event.target.checked })
            }
            className="h-4 w-4 rounded border-input accent-primary"
          />
        </label>

        <div className="space-y-1">
          <label
            htmlFor="ida-voice-language"
            className="text-xs text-muted-foreground"
          >
            {copy.voiceLanguage}
          </label>
          <select
            id="ida-voice-language"
            value={prefs.voiceLanguage}
            onChange={(event) =>
              setPrefs({ voiceLanguage: event.target.value as Locale })
            }
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
          >
            {LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="ida-speech-rate"
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <span>{copy.speechRate}</span>
            <span>{prefs.speechRate.toFixed(1)}×</span>
          </label>
          <input
            id="ida-speech-rate"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={prefs.speechRate}
            onChange={(event) =>
              setPrefs({ speechRate: Number(event.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
}