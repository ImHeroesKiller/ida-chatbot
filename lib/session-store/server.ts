import type { ChatSession, ChatStoreState } from "@/lib/chat-store";
import { createInitialStore } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { IdaMessage } from "@/lib/types";

import type { UserChatSessionRow, UserChatStateRow } from "./types";

interface SessionDbRow {
  user_id: string;
  chat_id: string;
  session_id: string;
  locale: Locale;
  title: string | null;
  messages: IdaMessage[];
  quick_replies: string[];
  pinned: boolean;
  chat_created_at: string | null;
  chat_updated_at: string | null;
}

function rowToChatSession(row: SessionDbRow): ChatSession {
  return {
    id: row.chat_id,
    title: row.title ?? "Chat",
    messages: Array.isArray(row.messages) ? row.messages : [],
    apiSessionId: row.session_id,
    pinned: Boolean(row.pinned),
    createdAt: row.chat_created_at
      ? new Date(row.chat_created_at).getTime()
      : Date.now(),
    updatedAt: row.chat_updated_at
      ? new Date(row.chat_updated_at).getTime()
      : Date.now(),
  };
}

export async function loadUserChatStore(
  userId: string,
): Promise<ChatStoreState | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();

  const [{ data: stateRow, error: stateError }, { data: sessionRows, error: sessionsError }] =
    await Promise.all([
      supabase
        .from("ida_user_chat_state")
        .select("user_id, current_chat_id, chat_order, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("ida_chat_sessions")
        .select(
          "user_id, chat_id, session_id, locale, title, messages, quick_replies, pinned, chat_created_at, chat_updated_at",
        )
        .eq("user_id", userId)
        .not("chat_id", "is", null),
    ]);

  if (stateError) {
    console.error("[IDA session-store load state]", stateError);
    return null;
  }

  if (sessionsError) {
    console.error("[IDA session-store load sessions]", sessionsError);
    return null;
  }

  if (!stateRow || !sessionRows?.length) return null;

  const userState = stateRow as UserChatStateRow;
  const chats = Object.fromEntries(
    (sessionRows as SessionDbRow[]).map((row) => [
      row.chat_id,
      rowToChatSession(row),
    ]),
  );

  const order = userState.chat_order.filter((id) => chats[id]);
  const missing = Object.keys(chats).filter((id) => !order.includes(id));
  const mergedOrder = [...order, ...missing];

  if (!chats[userState.current_chat_id]) {
    return null;
  }

  return {
    currentChatId: userState.current_chat_id,
    chats,
    order: mergedOrder,
  };
}

export async function saveUserChatStore(
  userId: string,
  store: ChatStoreState,
  locale: Locale,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const sessionRows: UserChatSessionRow[] = store.order
    .map((chatId) => store.chats[chatId])
    .filter((chat): chat is ChatSession => Boolean(chat))
    .map((chat) => ({
      user_id: userId,
      chat_id: chat.id,
      session_id: chat.apiSessionId,
      locale,
      title: chat.title,
      messages: chat.messages,
      quick_replies: [],
      pinned: Boolean(chat.pinned),
      chat_created_at: new Date(chat.createdAt).toISOString(),
      chat_updated_at: new Date(chat.updatedAt).toISOString(),
      updated_at: now,
    }));

  const stateRow: UserChatStateRow = {
    user_id: userId,
    current_chat_id: store.currentChatId,
    chat_order: store.order,
    updated_at: now,
  };

  const chatIds = sessionRows.map((row) => row.chat_id);

  const { error: upsertSessionsError } = await supabase
    .from("ida_chat_sessions")
    .upsert(sessionRows, { onConflict: "user_id,chat_id" });

  if (upsertSessionsError) {
    throw new Error(upsertSessionsError.message);
  }

  const { error: upsertStateError } = await supabase
    .from("ida_user_chat_state")
    .upsert(stateRow, { onConflict: "user_id" });

  if (upsertStateError) {
    throw new Error(upsertStateError.message);
  }

  const { data: remoteChats, error: listError } = await supabase
    .from("ida_chat_sessions")
    .select("chat_id")
    .eq("user_id", userId);

  if (listError) {
    console.error("[IDA session-store list]", listError);
    return;
  }

  const staleIds = (remoteChats ?? [])
    .map((row) => row.chat_id as string | null)
    .filter((id): id is string => typeof id === "string" && !chatIds.includes(id));

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("ida_chat_sessions")
      .delete()
      .eq("user_id", userId)
      .in("chat_id", staleIds);

    if (deleteError) {
      console.error("[IDA session-store prune]", deleteError);
    }
  }
}

export async function ensureUserChatStore(
  userId: string,
  locale: Locale,
): Promise<ChatStoreState> {
  const existing = await loadUserChatStore(userId);
  if (existing) return existing;

  const initial = createInitialStore(locale);
  await saveUserChatStore(userId, initial, locale);
  return initial;
}