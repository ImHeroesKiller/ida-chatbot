"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/config";
import { getQuickReplies } from "@/lib/handoff";
import { COPY } from "@/lib/i18n";
import type { IdaMessage } from "@/lib/types";

export const WELCOME_MESSAGE_ID = "ida-welcome";
export const CHAT_STORE_KEY = "ida-chat-store";
const MAX_SESSIONS = 50;

export interface ChatSession {
  id: string;
  title: string;
  messages: IdaMessage[];
  quickReplies: string[];
  apiSessionId: string;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatStoreState {
  currentChatId: string;
  chats: Record<string, ChatSession>;
  order: string[];
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createWelcomeMessage(locale: Locale): IdaMessage {
  return {
    id: WELCOME_MESSAGE_ID,
    role: "assistant",
    content: COPY[locale].welcome,
    createdAt: Date.now(),
  };
}

export function deriveChatTitle(
  messages: IdaMessage[],
  locale: Locale,
): string {
  const fallback: Record<Locale, string> = {
    id: "Chat baru",
    en: "New chat",
    zh: "新对话",
  };

  const firstUser = messages.find(
    (message) =>
      message.role === "user" &&
      message.id !== WELCOME_MESSAGE_ID &&
      message.content.trim(),
  );

  if (!firstUser) return fallback[locale];

  const trimmed = firstUser.content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}...` : trimmed;
}

export function sortSessions(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((a, b) => {
    const aPinned = Boolean(a.pinned);
    const bPinned = Boolean(b.pinned);

    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function createChatSession(locale: Locale): ChatSession {
  const now = Date.now();

  return {
    id: createId("chat"),
    title: locale === "zh" ? "新对话" : locale === "en" ? "New chat" : "Chat baru",
    messages: [createWelcomeMessage(locale)],
    quickReplies: getQuickReplies(locale),
    apiSessionId: createId("ida"),
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialStore(locale: Locale): ChatStoreState {
  const session = createChatSession(locale);

  return {
    currentChatId: session.id,
    chats: { [session.id]: session },
    order: [session.id],
  };
}

function normalizeSession(session: ChatSession): ChatSession {
  return { ...session, pinned: Boolean(session.pinned) };
}

export function loadChatStore(): ChatStoreState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CHAT_STORE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ChatStoreState;

    if (
      !parsed?.currentChatId ||
      !parsed.chats ||
      !Array.isArray(parsed.order) ||
      !parsed.chats[parsed.currentChatId]
    ) {
      return null;
    }

    const chats = Object.fromEntries(
      Object.entries(parsed.chats).map(([id, chat]) => [
        id,
        normalizeSession(chat),
      ]),
    );

    return { ...parsed, chats };
  } catch {
    return null;
  }
}

export function saveChatStore(state: ChatStoreState): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(state));
}

export function useChatStore(locale: Locale) {
  const [store, setStore] = useState<ChatStoreState>(() =>
    createInitialStore(locale),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadChatStore();
    if (loaded) {
      setStore(loaded);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveChatStore(store);
  }, [store, hydrated]);

  const currentChat = store.chats[store.currentChatId];

  const sessions = useMemo(
    () =>
      sortSessions(
        store.order
          .map((id) => store.chats[id])
          .filter((chat): chat is ChatSession => Boolean(chat)),
      ),
    [store.chats, store.order],
  );

  const updateCurrentChat = useCallback(
    (updater: (chat: ChatSession) => ChatSession) => {
      setStore((prev) => {
        const current = prev.chats[prev.currentChatId];
        if (!current) return prev;

        const updated = updater(current);

        return {
          ...prev,
          chats: {
            ...prev.chats,
            [prev.currentChatId]: updated,
          },
        };
      });
    },
    [],
  );

  const switchChat = useCallback((chatId: string) => {
    setStore((prev) => {
      if (!prev.chats[chatId]) return prev;
      return { ...prev, currentChatId: chatId };
    });
  }, []);

  const createChat = useCallback(() => {
    const session = createChatSession(locale);

    setStore((prev) => ({
      currentChatId: session.id,
      chats: { ...prev.chats, [session.id]: session },
      order: [session.id, ...prev.order.filter((id) => id !== session.id)].slice(
        0,
        MAX_SESSIONS,
      ),
    }));

    return session.id;
  }, [locale]);

  const pinChat = useCallback((chatId: string, pinned: boolean) => {
    setStore((prev) => {
      const chat = prev.chats[chatId];
      if (!chat) return prev;

      return {
        ...prev,
        chats: {
          ...prev.chats,
          [chatId]: { ...chat, pinned, updatedAt: Date.now() },
        },
      };
    });
  }, []);

  const renameChat = useCallback((chatId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setStore((prev) => {
      const chat = prev.chats[chatId];
      if (!chat) return prev;

      return {
        ...prev,
        chats: {
          ...prev.chats,
          [chatId]: { ...chat, title: trimmed, updatedAt: Date.now() },
        },
      };
    });
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      setStore((prev) => {
        if (!prev.chats[chatId]) return prev;

        const remainingIds = prev.order.filter((id) => id !== chatId);

        if (remainingIds.length === 0) {
          const session = createChatSession(locale);
          return {
            currentChatId: session.id,
            chats: { [session.id]: session },
            order: [session.id],
          };
        }

        const newChats = { ...prev.chats };
        delete newChats[chatId];

        return {
          currentChatId:
            prev.currentChatId === chatId ? remainingIds[0]! : prev.currentChatId,
          chats: newChats,
          order: remainingIds,
        };
      });
    },
    [locale],
  );

  const clearAllChats = useCallback(() => {
    const session = createChatSession(locale);
    setStore({
      currentChatId: session.id,
      chats: { [session.id]: session },
      order: [session.id],
    });
  }, [locale]);

  const persistCurrentChat = useCallback(
    (patch: Partial<Pick<ChatSession, "messages" | "quickReplies" | "title">>) => {
      updateCurrentChat((chat) => {
        const messages = patch.messages ?? chat.messages;
        const quickReplies = patch.quickReplies ?? chat.quickReplies;

        return {
          ...chat,
          ...patch,
          messages,
          quickReplies,
          title: patch.title ?? deriveChatTitle(messages, locale),
          updatedAt: Date.now(),
        };
      });
    },
    [locale, updateCurrentChat],
  );

  return {
    hydrated,
    currentChat,
    sessions,
    switchChat,
    createChat,
    pinChat,
    renameChat,
    deleteChat,
    clearAllChats,
    persistCurrentChat,
  };
}