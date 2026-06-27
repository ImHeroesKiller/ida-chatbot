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

export type MessageReaction = "up" | "down";

export const REACTIONS_STORAGE_KEY = "ida-message-reactions";

type ReactionMap = Record<string, MessageReaction>;

function readReactions(): ReactionMap {
  try {
    const raw = localStorage.getItem(REACTIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReactionMap;
  } catch {
    return {};
  }
}

function writeReactions(reactions: ReactionMap) {
  try {
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
  } catch {
    // ignore
  }
}

interface MessageReactionsContextValue {
  getReaction: (messageId: string) => MessageReaction | null;
  toggleReaction: (messageId: string, reaction: MessageReaction) => void;
}

const MessageReactionsContext =
  createContext<MessageReactionsContextValue | null>(null);

export function MessageReactionsProvider({ children }: { children: ReactNode }) {
  const [reactions, setReactions] = useState<ReactionMap>({});

  useEffect(() => {
    setReactions(readReactions());
  }, []);

  const getReaction = useCallback(
    (messageId: string): MessageReaction | null => reactions[messageId] ?? null,
    [reactions],
  );

  const toggleReaction = useCallback(
    (messageId: string, reaction: MessageReaction) => {
      setReactions((prev) => {
        const next = { ...prev };
        if (prev[messageId] === reaction) {
          delete next[messageId];
        } else {
          next[messageId] = reaction;
        }
        writeReactions(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ getReaction, toggleReaction }),
    [getReaction, toggleReaction],
  );

  return (
    <MessageReactionsContext.Provider value={value}>
      {children}
    </MessageReactionsContext.Provider>
  );
}

export function useMessageReactions(): MessageReactionsContextValue {
  const context = useContext(MessageReactionsContext);

  if (!context) {
    throw new Error(
      "useMessageReactions must be used within MessageReactionsProvider",
    );
  }

  return context;
}