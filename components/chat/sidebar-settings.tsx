"use client";

import {
  Moon,
  Settings,
  Sun,
  Trash2,
  Type,
  Volume2,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

import { useChatContext } from "@/components/chat/chat-provider";
import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { LOCALES, type Locale } from "@/lib/config";
import { useChatFontSize } from "@/lib/chat-font-prefs";
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

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
        {title}
      </div>
      {children}
    </div>
  );
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
  const { fontSize, setFontSize } = useChatFontSize();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fontSizeOptions = [
    { value: "small" as const, label: copy.fontSizeSmall },
    { value: "medium" as const, label: copy.fontSizeMedium },
    { value: "large" as const, label: copy.fontSizeLarge },
  ];

  useEffect(() => {
    if (expanded) return;
    setSettingsOpen(false);
  }, [expanded]);

  const handleToggleSettings = () => {
    if (!expanded) {
      onExpand?.();
      setSettingsOpen(true);
      return;
    }
    setSettingsOpen((open) => !open);
  };

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mx-auto h-12 w-12 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-90 transition-all"
        onClick={handleToggleSettings}
        title={copy.settings}
        aria-label={copy.settings}
      >
        <Settings className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-10 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium text-muted-foreground",
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
        <div className="mt-2.5 space-y-5 rounded-2xl border border-border/50 bg-background/80 p-3 shadow-sm">
          <SettingsSection title={copy.settingsAppearance} icon={Type}>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {fontSizeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={fontSize === option.value ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-lg text-xs font-medium"
                    onClick={() => setFontSize(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {LOCALES.map((loc) => (
                  <Button
                    key={loc}
                    type="button"
                    variant={appLocale === loc ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-lg text-xs font-medium"
                    onClick={() => setLocale(loc)}
                  >
                    {LOCALE_LABELS[loc]}
                  </Button>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start gap-2.5 rounded-lg px-2.5 text-sm"
                onClick={toggleTheme}
              >
                {themeHydrated && theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                {copy.toggleTheme}
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection title={copy.voiceSettings} icon={Volume2}>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 text-sm">
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

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 text-sm">
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

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 text-sm">
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

              <div className="space-y-1.5">
                <label
                  htmlFor="ida-voice-language"
                  className="px-1 text-xs font-medium text-muted-foreground"
                >
                  {copy.voiceLanguage}
                </label>
                <select
                  id="ida-voice-language"
                  value={prefs.voiceLanguage}
                  onChange={(event) =>
                    setPrefs({ voiceLanguage: event.target.value as Locale })
                  }
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-2.5 text-sm"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="ida-speech-rate"
                  className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="ida-speech-pitch"
                  className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground"
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
          </SettingsSection>

          <SettingsSection title={copy.settingsData} icon={Trash2}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-full justify-start gap-2.5 rounded-lg px-2.5 text-sm font-medium text-destructive",
                "hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={onClearAllChats}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {copy.clearAllChats}
            </Button>
          </SettingsSection>
        </div>
      )}
    </div>
  );
}