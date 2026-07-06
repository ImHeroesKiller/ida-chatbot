"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  formatCompactMoney,
  formatDate,
  formatNumber,
  formatRelativeTimeKey,
  formatTime,
  localizeRelativeLabel,
} from "@/lib/enterprise/i18n/format";
import {
  DEFAULT_ENTERPRISE_LOCALE,
  ENTERPRISE_LOCALE_STORAGE_KEY,
  getEnterpriseMessages,
} from "@/lib/enterprise/i18n/messages";
import { translate } from "@/lib/enterprise/i18n/translate";
import type { EnterpriseLocale, EnterpriseMessages, VocabularyKey } from "@/lib/enterprise/i18n/types";

type EnterpriseLocaleContextValue = {
  locale: EnterpriseLocale;
  messages: EnterpriseMessages;
  setLocale: (locale: EnterpriseLocale) => void;
  mode: "presentation" | "internal";
  t: (scope: keyof EnterpriseMessages, key: string, params?: Record<string, string | number>) => string;
  tv: (term: VocabularyKey) => string;
  format: {
    money: (label: string) => string;
    number: (value: number, options?: Intl.NumberFormatOptions) => string;
    date: (date: Date | string | number) => string;
    time: (date: Date | string | number) => string;
    relative: (label: string) => string;
    relativeKey: (key: string, count?: number) => string;
  };
};

const EnterpriseLocaleContext = createContext<EnterpriseLocaleContextValue | null>(null);

export function EnterpriseLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<EnterpriseLocale>(DEFAULT_ENTERPRISE_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ENTERPRISE_LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "id") {
      setLocaleState(stored);
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((next: EnterpriseLocale) => {
    setLocaleState(next);
    localStorage.setItem(ENTERPRISE_LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === "id" ? "id" : "en";
  }, []);

  const messages = useMemo(() => getEnterpriseMessages(locale), [locale]);

  const relativeMessages = useMemo(() => {
    const rt = messages.content.relativeTime as Record<string, string>;
    return rt ?? {};
  }, [messages]);

  const value = useMemo<EnterpriseLocaleContextValue>(() => {
    const t = (
      scope: keyof EnterpriseMessages,
      key: string,
      params?: Record<string, string | number>,
    ) => translate(messages[scope] as Record<string, unknown>, key, params);

    return {
      locale,
      messages,
      setLocale,
      mode: locale === "en" ? "presentation" : "internal",
      t,
      tv: (term: VocabularyKey) => messages.vocabulary[term] ?? term,
      format: {
        money: (label: string) => formatCompactMoney(locale, label),
        number: (value: number, options?: Intl.NumberFormatOptions) =>
          formatNumber(locale, value, options),
        date: (date: Date | string | number) => formatDate(locale, date),
        time: (date: Date | string | number) => formatTime(locale, date),
        relative: (label: string) => localizeRelativeLabel(locale, label, relativeMessages),
        relativeKey: (key: string, count?: number) =>
          formatRelativeTimeKey(locale, key, count, relativeMessages),
      },
    };
  }, [locale, messages, relativeMessages, setLocale]);

  if (!hydrated) {
    return (
      <EnterpriseLocaleContext.Provider value={value}>
        {children}
      </EnterpriseLocaleContext.Provider>
    );
  }

  return (
    <EnterpriseLocaleContext.Provider value={value}>
      {children}
    </EnterpriseLocaleContext.Provider>
  );
}

export function useEnterpriseLocale() {
  const ctx = useContext(EnterpriseLocaleContext);
  if (!ctx) {
    throw new Error("useEnterpriseLocale must be used within EnterpriseLocaleProvider");
  }
  return ctx;
}