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

import type { Locale } from "@/lib/config";
import {
  readStoredLocale,
  writeStoredLocale,
} from "@/lib/locale-prefs";
import type { IdaHandoffPrefill } from "@/lib/types";

interface ChatContextValue {
  locale: Locale;
  localeHydrated: boolean;
  setLocale: (locale: Locale) => void;
  handoffPrefill: IdaHandoffPrefill | null;
  openHandoff: (prefill: IdaHandoffPrefill) => void;
  closeHandoff: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  defaultLocale = "id",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [localeHydrated, setLocaleHydrated] = useState(false);
  const [handoffPrefill, setHandoffPrefill] =
    useState<IdaHandoffPrefill | null>(null);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocaleState(stored);
    setLocaleHydrated(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  const openHandoff = useCallback((prefill: IdaHandoffPrefill) => {
    setHandoffPrefill(prefill);
  }, []);

  const closeHandoff = useCallback(() => {
    setHandoffPrefill(null);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      localeHydrated,
      setLocale,
      handoffPrefill,
      openHandoff,
      closeHandoff,
    }),
    [locale, localeHydrated, handoffPrefill, openHandoff, closeHandoff, setLocale],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }

  return context;
}