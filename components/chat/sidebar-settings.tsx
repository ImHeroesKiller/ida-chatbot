"use client";

import {
  Globe,
  Moon,
  Settings,
  Sun,
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useChatContext } from "@/components/chat/chat-provider";
import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = {
  id: "ID",
  en: "EN",
  zh: "ZH",
};

interface SidebarSettingsProps {
  locale: Locale;
  expanded: boolean;
  onClearAllChats: () => void;
  onExpand?: () => void;
}

export function SidebarSettings({
  locale,
  expanded,
  onClearAllChats,
  onExpand,
}: SidebarSettingsProps) {
  const copy = COPY[locale];
  const { locale: appLocale, setLocale } = useChatContext();
  const { theme, hydrated: themeHydrated, toggleTheme } = useThemeContext();
  const { prefs, setPrefs } = useVoicePrefs();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleToggleSettings = () => {
    if (!expanded) onExpand?.();
    setSettingsOpen((open) => !open);
  };

  if (!expanded) {
    return (
      <div className="shrink-0 space-y-1 border-t p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-9 w-full transition-transform hover:scale-105 active:scale-95"
          onClick={handleToggleSettings}
          title={copy.settings}
          aria-label={copy.settings}
          aria-expanded={settingsOpen}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {settingsOpen && (
          <div className="space-y-1 rounded-lg border bg-background/90 p-1.5 shadow-sm">
            <div className="flex gap-1">
              {LOCALES.map((loc) => (
                <Button
                  key={loc}
                  type="button"
                  variant={appLocale === loc ? "default" : "ghost"}
                  size="xs"
                  className="flex-1 px-0 text-[10px]"
                  onClick={() => setLocale(loc)}
                >
                  {LOCALE_LABELS[loc]}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-full"
              onClick={toggleTheme}
              title={copy.toggleTheme}
              aria-label={copy.toggleTheme}
            >
              {themeHydrated && theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
            <Link
              href="/account"
              title={copy.account}
              aria-label={copy.account}
              className={cn(
                "inline-flex h-8 w-full items-center justify-center rounded-lg",
                "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              <User className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t bg-muted/10 p-2 dark:bg-muted/5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 w-full justify-start gap-2 text-xs text-muted-foreground",
          "hover:bg-muted/80 hover:text-foreground",
          settingsOpen && "bg-muted/80 text-foreground",
        )}
        onClick={handleToggleSettings}
        aria-expanded={settingsOpen}
        aria-label={copy.settings}
      >
        <Settings className="h-4 w-4 shrink-0" />
        <span>{copy.settings}</span>
      </Button>

      {settingsOpen && (
        <div className="mt-2 space-y-3 rounded-xl border bg-background/70 p-2.5 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-0.5 text-[11px] font-medium text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              {copy.appLanguage}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {LOCALES.map((loc) => (
                <Button
                  key={loc}
                  type="button"
                  variant={appLocale === loc ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setLocale(loc)}
                >
                  {LOCALE_LABELS[loc]}
                </Button>
              ))}
            </div>
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

            <Link
              href="/account"
              className={cn(
                "inline-flex h-8 w-full items-center justify-start gap-2 rounded-lg px-2 text-xs",
                "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              <User className="h-3.5 w-3.5" />
              {copy.account}
            </Link>

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

          <div className="space-y-2.5 border-t pt-2.5">
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
              <span>{copy.reviewVoiceBeforeSend}</span>
              <input
                type="checkbox"
                checked={prefs.reviewVoiceBeforeSend}
                onChange={(event) =>
                  setPrefs({ reviewVoiceBeforeSend: event.target.checked })
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
                    {LOCALE_LABELS[loc]} —{" "}
                    {loc === "id"
                      ? "Bahasa Indonesia"
                      : loc === "en"
                        ? "English"
                        : "中文"}
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

            <div className="space-y-1">
              <label
                htmlFor="ida-speech-pitch"
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>{copy.speechPitch}</span>
                <span>{prefs.speechPitch.toFixed(1)}×</span>
              </label>
              <input
                id="ida-speech-pitch"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={prefs.speechPitch}
                onChange={(event) =>
                  setPrefs({ speechPitch: Number(event.target.value) })
                }
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}