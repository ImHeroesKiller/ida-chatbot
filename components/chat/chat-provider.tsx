"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Locale } from "@/lib/config";
import type { IdaHandoffPrefill } from "@/lib/types";

interface ChatContextValue {
  locale: Locale;
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
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [handoffPrefill, setHandoffPrefill] =
    useState<IdaHandoffPrefill | null>(null);

  const openHandoff = useCallback((prefill: IdaHandoffPrefill) => {
    setHandoffPrefill(prefill);
  }, []);

  const closeHandoff = useCallback(() => {
    setHandoffPrefill(null);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      handoffPrefill,
      openHandoff,
      closeHandoff,
    }),
    [locale, handoffPrefill, openHandoff, closeHandoff],
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