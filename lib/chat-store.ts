"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  fetchRemoteChatStore,
  initializeRemoteChatStore,
  persistRemoteChatStore,
} from "@/lib/client/sync-sessions";
import { getOrCreateAnonymousUserId } from "@/lib/client/user-id";
import type { Locale } from "@/lib/config";
import { inferQuickReplies } from "@/lib/quick-replies";
import { COPY } from "@/lib/i18n";
import type { IdaMessage } from "@/lib/types";

export const WELCOME_MESSAGE_ID = "ida-welcome";
/** @deprecated Legacy unscoped key — migrated to per-user / anonymous scopes */
export const CHAT_STORE_KEY = "ida-chat-store";
export const CHAT_STORE_KEY_PREFIX = "ida-chat-store:";
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

export type ChatStoreScope =
  | { kind: "authenticated"; userId: string }
  | { kind: "anonymous"; deviceId: string };

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
  const welcomeMessage = createWelcomeMessage(locale);

  return {
    id: createId("chat"),
    title: locale === "zh" ? "新对话" : locale === "en" ? "New chat" : "Chat baru",
    messages: [welcomeMessage],
    quickReplies: inferQuickReplies({ locale, messages: [] }),
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

function parseChatStoreState(raw: string): ChatStoreState | null {
  try {
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

export function resolveChatStoreScope(options: {
  authUserId?: string | null;
  anonymousDeviceId: string;
}): ChatStoreScope {
  if (options.authUserId) {
    return { kind: "authenticated", userId: options.authUserId };
  }

  return { kind: "anonymous", deviceId: options.anonymousDeviceId };
}

export function getChatStoreStorageKey(scope: ChatStoreScope): string {
  if (scope.kind === "authenticated") {
    return `${CHAT_STORE_KEY_PREFIX}user:${scope.userId}`;
  }

  return `${CHAT_STORE_KEY_PREFIX}anonymous:${scope.deviceId}`;
}

export function hasMeaningfulChatHistory(store: ChatStoreState): boolean {
  if (store.order.length > 1) return true;

  const current = store.chats[store.currentChatId];
  if (!current) return false;

  return current.messages.some(
    (message) =>
      message.role === "user" &&
      message.id !== WELCOME_MESSAGE_ID &&
      message.content.trim().length > 0,
  );
}

export function loadChatStore(scope: ChatStoreScope): ChatStoreState | null {
  if (typeof window === "undefined") return null;

  const scopedKey = getChatStoreStorageKey(scope);
  const scopedRaw = localStorage.getItem(scopedKey);
  if (scopedRaw) {
    return parseChatStoreState(scopedRaw);
  }

  return migrateLegacyChatStore(scope);
}

function migrateLegacyChatStore(scope: ChatStoreScope): ChatStoreState | null {
  if (typeof window === "undefined") return null;

  const legacyRaw = localStorage.getItem(CHAT_STORE_KEY);
  if (!legacyRaw) return null;

  const parsed = parseChatStoreState(legacyRaw);
  if (!parsed) {
    localStorage.removeItem(CHAT_STORE_KEY);
    return null;
  }

  saveChatStore(parsed, scope);
  localStorage.removeItem(CHAT_STORE_KEY);
  return parsed;
}

export function saveChatStore(
  state: ChatStoreState,
  scope: ChatStoreScope,
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    getChatStoreStorageKey(scope),
    JSON.stringify(state),
  );
}

export function clearChatStore(scope: ChatStoreScope): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(getChatStoreStorageKey(scope));
}

const REMOTE_SYNC_DEBOUNCE_MS = 1200;

export function useChatStore(locale: Locale) {
  const { user, loading: authLoading } = useAuth();
  const anonymousDeviceIdRef = useRef<string>("");
  if (!anonymousDeviceIdRef.current) {
    anonymousDeviceIdRef.current = getOrCreateAnonymousUserId();
  }
  const anonymousDeviceId = anonymousDeviceIdRef.current;

  const scope = useMemo(
    () =>
      resolveChatStoreScope({
        authUserId: user?.id,
        anonymousDeviceId,
      }),
    [user?.id, anonymousDeviceId],
  );

  const scopeStorageKey = useMemo(
    () => getChatStoreStorageKey(scope),
    [scope],
  );

  const [store, setStore] = useState<ChatStoreState>(() =>
    createInitialStore(locale),
  );
  const [hydrated, setHydrated] = useState(false);
  const loadedScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (loadedScopeRef.current === scopeStorageKey) {
      return;
    }

    loadedScopeRef.current = scopeStorageKey;
    let cancelled = false;

    setHydrated(false);
    setStore(createInitialStore(locale));

    async function hydrateAuthenticated(
      authScope: Extract<ChatStoreScope, { kind: "authenticated" }>,
    ) {
      const userLocal = loadChatStore(authScope);
      const anonymousScope = resolveChatStoreScope({
        authUserId: null,
        anonymousDeviceId,
      });
      const anonymousLocal = loadChatStore(anonymousScope);

      let remote = await fetchRemoteChatStore(locale);
      if (cancelled) return;

      if (remote) {
        setStore(remote);
        saveChatStore(remote, authScope);
        return;
      }

      if (userLocal) {
        setStore(userLocal);
        await persistRemoteChatStore(userLocal, locale);
        return;
      }

      if (anonymousLocal && hasMeaningfulChatHistory(anonymousLocal)) {
        setStore(anonymousLocal);
        saveChatStore(anonymousLocal, authScope);
        await persistRemoteChatStore(anonymousLocal, locale);
        clearChatStore(anonymousScope);
        return;
      }

      remote = await initializeRemoteChatStore(locale);
      if (cancelled) return;

      if (remote) {
        setStore(remote);
        saveChatStore(remote, authScope);
      }
    }

    async function hydrateAnonymous() {
      const anonymousScope = resolveChatStoreScope({
        authUserId: null,
        anonymousDeviceId,
      });
      const local = loadChatStore(anonymousScope);

      if (cancelled) return;

      if (local) {
        setStore(local);
      }
    }

    async function hydrate() {
      try {
        if (scope.kind === "authenticated") {
          await hydrateAuthenticated(scope);
        } else {
          await hydrateAnonymous();
        }
      } catch (error) {
        console.error("[IDA chat-store hydrate]", error);

        if (!cancelled) {
          const fallback = loadChatStore(scope);
          if (fallback) setStore(fallback);
        }
      }

      if (!cancelled) setHydrated(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [locale, scope, scopeStorageKey, authLoading, anonymousDeviceId]);

  useEffect(() => {
    if (!hydrated) return;

    saveChatStore(store, scope);

    if (scope.kind !== "authenticated") return;

    const timer = window.setTimeout(() => {
      void persistRemoteChatStore(store, locale).catch((error) => {
        console.error("[IDA chat-store persist]", error);
      });
    }, REMOTE_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [store, hydrated, scope, locale]);

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

  const authUserId = user?.id ?? null;
  const apiUserId = authUserId ?? anonymousDeviceId;

  return {
    hydrated,
    authUserId,
    anonymousDeviceId,
    apiUserId,
    /** @deprecated Use apiUserId */
    userId: apiUserId,
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