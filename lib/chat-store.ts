"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  fetchDeviceChatStore,
  fetchRemoteChatStore,
  initializeDeviceChatStore,
  initializeRemoteChatStore,
  persistDeviceChatStore,
  persistRemoteChatStore,
} from "@/lib/client/sync-sessions";
import { ensureApiSessionId } from "@/lib/client/chat-api-payload";
import { getOrCreateAnonymousUserId } from "@/lib/client/user-id";
import { normalizeRightSidebarPanel } from "@/lib/chat-tools";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { ResearchSession } from "@/lib/research-types";
import type { WorksheetDocument } from "@/lib/worksheet";
import type { Locale } from "@/lib/config";
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
  apiSessionId: string;
  activeRightPanel?: RightSidebarPanel | null;
  worksheetToolEnabled?: boolean;
  webSearchEnabled?: boolean;
  researchEnabled?: boolean;
  researchSessions?: ResearchSession[];
  worksheet?: WorksheetDocument | null;
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

/** Fresh worksheet workspace — never reuse or spread from another chat. */
export function createEmptyWorksheet(): WorksheetDocument {
  return {
    documents: [],
    activeDocumentId: null,
    title: "",
    content: "",
    updatedAt: Date.now(),
  };
}

function resolvePersistedWorksheet(
  worksheet: WorksheetDocument | null | undefined,
): WorksheetDocument {
  if (!worksheet) return createEmptyWorksheet();
  return cloneWorksheet(worksheet) ?? createEmptyWorksheet();
}

function cloneWorksheet(
  worksheet: WorksheetDocument | null | undefined,
): WorksheetDocument | null {
  if (!worksheet) return null;

  return {
    ...worksheet,
    documents: worksheet.documents?.map((document) => ({ ...document })) ?? [],
    versions: worksheet.versions?.map((version) => ({ ...version })),
  };
}

const GENERIC_CHAT_TITLES: Record<Locale, string> = {
  id: "Chat baru",
  en: "New Chat",
  zh: "新对话",
};

const MAX_TITLE_WORDS = 7;

const TITLE_FILLER_PATTERNS = [
  /^(bantu|tolong|mohon|hai|halo|hello|hi|hey|please|help me|can you|could you|bisakah|apakah kamu bisa|我想|请|帮我)\s+/i,
  /^(buatkan|buat|create|make|generate|write|draft)\s+(saya\s+|me\s+)?/i,
];

const TITLE_TOPIC_PATTERNS: Array<{
  pattern: RegExp;
  format: (topic: string, locale: Locale) => string;
}> = [
  {
    pattern:
      /cara\s+(mengajukan|mengurus|daftar|memproses|apply(?:\s+for)?)\s+(.+)/i,
    format: (topic, locale) =>
      locale === "zh"
        ? `申请${topic}`
        : locale === "en"
          ? `Applying for ${topic}`
          : `Pengajuan ${topic}`,
  },
  {
    pattern: /cara\s+(membuat|buat|buatkan|create|make)\s+(.+)/i,
    format: (topic, locale) =>
      locale === "zh"
        ? `制作${topic}`
        : locale === "en"
          ? `Creating ${topic}`
          : `Pembuatan ${topic}`,
  },
  {
    pattern: /(?:tentang|mengenai|about|regarding|关于)\s+(.+)/i,
    format: (topic) => topic,
  },
];

const TITLE_STOP_WORDS =
  /^(saya|aku|me|my|the|a|an|untuk|for|yang|dan|atau|with|di|on|in|ke|to|dari|from)\s+/i;

export function isGenericChatTitle(title: string, locale: Locale): boolean {
  const normalized = title.trim().toLowerCase();
  return (
    normalized === GENERIC_CHAT_TITLES[locale].toLowerCase() ||
    normalized === GENERIC_CHAT_TITLES.id.toLowerCase() ||
    normalized === GENERIC_CHAT_TITLES.en.toLowerCase() ||
    normalized === GENERIC_CHAT_TITLES.zh.toLowerCase()
  );
}

function stripWelcomeMessages(messages: IdaMessage[]): IdaMessage[] {
  return messages.filter((message) => message.id !== WELCOME_MESSAGE_ID);
}

function cleanTitleSource(text: string): string {
  let cleaned = text.trim().replace(/\s+/g, " ");

  for (const pattern of TITLE_FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned.replace(/[?.!,;:]+$/g, "").trim();
}

function toTitleWords(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).slice(0, MAX_TITLE_WORDS);
  if (words.length === 0) return "";

  return words
    .map((word) => {
      if (/^\d{4}$/.test(word)) return word;
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      if (/^[A-Z][a-z]+/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function trimTitleTopic(text: string): string {
  let topic = text.trim();

  while (TITLE_STOP_WORDS.test(topic)) {
    topic = topic.replace(TITLE_STOP_WORDS, "").trim();
  }

  return topic.replace(/[?.!,;:]+$/g, "").trim();
}

function extractTitleTopic(sources: string[], locale: Locale): string {
  for (const source of sources) {
    for (const { pattern, format } of TITLE_TOPIC_PATTERNS) {
      const match = source.match(pattern);
      if (!match?.[2] && !match?.[1]) continue;

      const rawTopic = trimTitleTopic(match[2] ?? match[1] ?? "");
      if (!rawTopic) continue;

      return toTitleWords(format(rawTopic, locale));
    }
  }

  const ranked = [...sources].sort((a, b) => b.length - a.length);
  const best = ranked.find((source) => source.split(/\s+/).length >= 2) ?? ranked[0];

  return best ? toTitleWords(trimTitleTopic(best)) : "";
}

export function shouldAutoRenameChat(
  messages: IdaMessage[],
  title: string,
  locale: Locale,
): boolean {
  if (!isGenericChatTitle(title, locale)) return false;

  const conversationMessages = stripWelcomeMessages(messages);
  const userCount = conversationMessages.filter(
    (message) => message.role === "user" && message.content.trim(),
  ).length;
  const assistantCount = conversationMessages.filter(
    (message) => message.role === "assistant" && message.content.trim(),
  ).length;

  return (
    userCount >= 1 &&
    assistantCount >= 1 &&
    userCount + assistantCount >= 3
  );
}

export function deriveChatTitle(
  messages: IdaMessage[],
  locale: Locale,
): string {
  const fallback = GENERIC_CHAT_TITLES[locale];
  const conversationMessages = stripWelcomeMessages(messages);
  const userMessages = conversationMessages.filter(
    (message) => message.role === "user" && message.content.trim(),
  );
  const assistantMessages = conversationMessages.filter(
    (message) => message.role === "assistant" && message.content.trim(),
  );

  if (
    userMessages.length < 1 ||
    assistantMessages.length < 1 ||
    userMessages.length + assistantMessages.length < 3
  ) {
    return fallback;
  }

  const sources = userMessages
    .slice(0, 3)
    .map((message) => cleanTitleSource(message.content));

  const title = extractTitleTopic(sources, locale);
  return title || fallback;
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

  // New Chat: always start with a generic title and an isolated empty worksheet.
  // Never spread from an existing chat session.
  return {
    id: createId("chat"),
    title: GENERIC_CHAT_TITLES[locale],
    messages: [],
    apiSessionId: createId("ida"),
    activeRightPanel: null,
    worksheetToolEnabled: false,
    webSearchEnabled: false,
    researchEnabled: false,
    researchSessions: [],
    worksheet: createEmptyWorksheet(),
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

function normalizeSession(
  session: ChatSession & { quickReplies?: string[] },
): ChatSession {
  const { quickReplies: _legacyQuickReplies, ...rest } = session;
  const panel = normalizeRightSidebarPanel(
    rest.activeRightPanel as string | null | undefined,
  );

  return {
    ...rest,
    messages: stripWelcomeMessages(session.messages),
    apiSessionId: ensureApiSessionId(rest.apiSessionId),
    activeRightPanel: panel,
    worksheetToolEnabled:
      rest.worksheetToolEnabled ?? panel === "worksheet",
    webSearchEnabled:
      rest.webSearchEnabled ?? panel === "web-search",
    researchEnabled:
      rest.researchEnabled ?? panel === "research",
    researchSessions: Array.isArray(rest.researchSessions)
      ? rest.researchSessions
      : [],
    worksheet: rest.worksheet ?? null,
    pinned: Boolean(session.pinned),
  };
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

/** Merge remote and local stores, preferring newer per-chat revisions and local order. */
export function mergeChatStores(
  remote: ChatStoreState,
  local: ChatStoreState,
): ChatStoreState {
  const chats: Record<string, ChatSession> = { ...remote.chats };

  for (const [chatId, localChat] of Object.entries(local.chats)) {
    const remoteChat = chats[chatId];
    if (!remoteChat || localChat.updatedAt >= remoteChat.updatedAt) {
      chats[chatId] = localChat;
    }
  }

  const order: string[] = [];
  const seen = new Set<string>();

  for (const chatId of local.order) {
    if (chats[chatId] && !seen.has(chatId)) {
      order.push(chatId);
      seen.add(chatId);
    }
  }

  for (const chatId of remote.order) {
    if (chats[chatId] && !seen.has(chatId)) {
      order.push(chatId);
      seen.add(chatId);
    }
  }

  for (const chatId of Object.keys(chats)) {
    if (!seen.has(chatId)) {
      order.push(chatId);
      seen.add(chatId);
    }
  }

  const currentChatId = chats[local.currentChatId]
    ? local.currentChatId
    : chats[remote.currentChatId]
      ? remote.currentChatId
      : order[0]!;

  return {
    currentChatId,
    chats,
    order: order.slice(0, MAX_SESSIONS),
  };
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
  const lastSyncedOrderLengthRef = useRef(0);

  useEffect(() => {
    if (authLoading) return;

    if (loadedScopeRef.current === scopeStorageKey) {
      return;
    }

    loadedScopeRef.current = scopeStorageKey;
    let cancelled = false;

    setHydrated(false);
    lastSyncedOrderLengthRef.current = 0;
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

      if (remote && userLocal) {
        const merged = mergeChatStores(remote, userLocal);
        setStore(merged);
        saveChatStore(merged, authScope);
        await persistRemoteChatStore(merged, locale);
        return;
      }

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

      let remote: ChatStoreState | null = null;
      try {
        remote = await fetchDeviceChatStore(locale, anonymousDeviceId);
      } catch (error) {
        console.error("[IDA chat-store device fetch]", error);
      }

      if (cancelled) return;

      if (remote && local) {
        const merged = mergeChatStores(remote, local);
        setStore(merged);
        saveChatStore(merged, anonymousScope);
        try {
          await persistDeviceChatStore(merged, locale, anonymousDeviceId);
        } catch (error) {
          console.error("[IDA chat-store device persist]", error);
        }
        return;
      }

      if (remote) {
        setStore(remote);
        saveChatStore(remote, anonymousScope);
        return;
      }

      if (local) {
        setStore(local);
        try {
          await persistDeviceChatStore(local, locale, anonymousDeviceId);
        } catch (error) {
          console.error("[IDA chat-store device persist]", error);
        }
        return;
      }

      try {
        remote = await initializeDeviceChatStore(locale, anonymousDeviceId);
      } catch (error) {
        console.error("[IDA chat-store device init]", error);
      }

      if (cancelled) return;

      if (remote) {
        setStore(remote);
        saveChatStore(remote, anonymousScope);
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

    const syncRemote = () => {
      if (scope.kind === "authenticated") {
        void persistRemoteChatStore(store, locale).catch((error) => {
          console.error("[IDA chat-store persist]", error);
        });
        return;
      }

      void persistDeviceChatStore(store, locale, anonymousDeviceId).catch(
        (error) => {
          console.error("[IDA chat-store device persist]", error);
        },
      );
    };

    const shouldSyncImmediately =
      store.order.length > lastSyncedOrderLengthRef.current;
    lastSyncedOrderLengthRef.current = store.order.length;

    if (shouldSyncImmediately) {
      syncRemote();
      return;
    }

    const timer = window.setTimeout(syncRemote, REMOTE_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [store, hydrated, scope, locale, anonymousDeviceId]);

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

    setStore((prev) => {
      // Append only the new session; leave every existing chat entry untouched.
      return {
        currentChatId: session.id,
        chats: { ...prev.chats, [session.id]: session },
        order: [session.id, ...prev.order.filter((id) => id !== session.id)].slice(
          0,
          MAX_SESSIONS,
        ),
      };
    });

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
    (
      patch: Partial<
        Pick<
          ChatSession,
          | "messages"
          | "title"
          | "activeRightPanel"
          | "worksheetToolEnabled"
          | "webSearchEnabled"
          | "researchEnabled"
          | "researchSessions"
          | "worksheet"
        >
      >,
    ) => {
      updateCurrentChat((chat) => {
        const messages = patch.messages ?? chat.messages;

        const nextTitle =
          patch.title ??
          (shouldAutoRenameChat(messages, chat.title, locale)
            ? deriveChatTitle(messages, locale)
            : chat.title);

        return {
          ...chat,
          ...patch,
          messages,
          title: nextTitle,
          activeRightPanel:
            patch.activeRightPanel !== undefined
              ? patch.activeRightPanel
              : chat.activeRightPanel ?? null,
          worksheetToolEnabled:
            patch.worksheetToolEnabled !== undefined
              ? patch.worksheetToolEnabled
              : Boolean(chat.worksheetToolEnabled),
          webSearchEnabled:
            patch.webSearchEnabled !== undefined
              ? patch.webSearchEnabled
              : Boolean(chat.webSearchEnabled),
          researchEnabled:
            patch.researchEnabled !== undefined
              ? patch.researchEnabled
              : Boolean(chat.researchEnabled),
          researchSessions:
            patch.researchSessions !== undefined
              ? patch.researchSessions
              : (chat.researchSessions ?? []),
          worksheet:
            patch.worksheet !== undefined
              ? resolvePersistedWorksheet(patch.worksheet)
              : resolvePersistedWorksheet(chat.worksheet),
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