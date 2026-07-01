"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Moon,
  Settings,
  Sun,
  Trash2,
  Type,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";

import { useChatContext } from "@/components/chat/chat-provider";
import { useThemeContext } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex items-center gap-2 px-0.5 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
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
    if (!settingsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  const handleClearAllChats = () => {
    setSettingsOpen(false);
    onClearAllChats();
  };

  const settingsButton = (
    <Button
      type="button"
      variant="ghost"
      size={expanded ? "sm" : "icon"}
      className={cn(
        expanded
          ? cn(
              "h-10 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium text-muted-foreground",
              "hover:bg-muted/80 hover:text-foreground",
              settingsOpen && "bg-muted/80 text-foreground",
            )
          : "mx-auto h-12 w-12 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-90 transition-all",
      )}
      onClick={() => setSettingsOpen(true)}
      aria-expanded={settingsOpen}
      aria-haspopup="dialog"
      aria-label={copy.settings}
      title={copy.settings}
    >
      <Settings className={cn("shrink-0", expanded ? "h-4 w-4" : "h-5 w-5")} />
      {expanded ? <span>{copy.settings}</span> : null}
    </Button>
  );

  if (typeof document === "undefined") {
    return <div className="shrink-0">{settingsButton}</div>;
  }

  return (
    <div className="shrink-0">
      {settingsButton}

      {createPortal(
        <AnimatePresence>
          {settingsOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:p-6"
              onClick={() => setSettingsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                onClick={(event) => event.stopPropagation()}
                className="flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label={copy.settings}
              >
                <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0 shadow-2xl">
                  <CardHeader className="shrink-0 flex-row items-center justify-between space-y-0 border-b px-5 pt-5 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="h-4 w-4 text-primary" />
                      {copy.settings}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setSettingsOpen(false)}
                      aria-label={copy.handoffClose}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
                    <div className="space-y-5">
                      <SettingsSection title={copy.settingsAppearance} icon={Type}>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-1.5">
                            {fontSizeOptions.map((option) => (
                              <Button
                                key={option.value}
                                type="button"
                                variant={
                                  fontSize === option.value ? "default" : "outline"
                                }
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
                              className="h-4 w-4 rounded border-foreground/25 accent-primary"
                            />
                          </label>

                          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 text-sm">
                            <span>{copy.reviewVoiceBeforeSend}</span>
                            <input
                              type="checkbox"
                              checked={prefs.reviewVoiceBeforeSend}
                              onChange={(event) =>
                                setPrefs({
                                  reviewVoiceBeforeSend: event.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-foreground/25 accent-primary"
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
                              className="h-4 w-4 rounded border-foreground/25 accent-primary"
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
                                setPrefs({
                                  voiceLanguage: event.target.value as Locale,
                                })
                              }
                              className="h-9 w-full rounded-lg border border-foreground/25 bg-background px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-foreground/50 focus-visible:ring-3 focus-visible:ring-foreground/10"
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
                          onClick={handleClearAllChats}
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                          {copy.clearAllChats}
                        </Button>
                      </SettingsSection>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}