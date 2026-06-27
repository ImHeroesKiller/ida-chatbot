import {
  BufferWindowMemory,
  ChatMessageHistory,
} from "@langchain/classic/memory";

import { IDA_CONFIG } from "@/lib/config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/config";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface SessionRow {
  messages: ConversationMessage[];
}

/** Build LangChain BufferWindowMemory context from prior messages */
export async function buildConversationMemoryContext(
  messages: ConversationMessage[],
): Promise<string> {
  const priorMessages = messages.slice(0, -1);
  if (priorMessages.length === 0) return "";

  const history = new ChatMessageHistory();

  for (const message of priorMessages) {
    if (message.role === "user") {
      await history.addUserMessage(message.content);
    } else {
      await history.addAIMessage(message.content);
    }
  }

  const memory = new BufferWindowMemory({
    chatHistory: history,
    memoryKey: "chat_history",
    inputKey: "input",
    k: IDA_CONFIG.memoryWindowK,
    returnMessages: false,
  });

  const variables = await memory.loadMemoryVariables({});
  const chatHistory = variables.chat_history;

  if (typeof chatHistory === "string" && chatHistory.trim()) {
    return chatHistory.trim();
  }

  return "";
}

export async function persistSessionMessages(options: {
  sessionId: string;
  locale: Locale;
  messages: ConversationMessage[];
}): Promise<void> {
  if (!isSupabaseConfigured() || !options.sessionId) return;

  try {
    const supabase = getSupabaseAdmin();

    await supabase.from("ida_chat_sessions").upsert(
      {
        session_id: options.sessionId,
        locale: options.locale,
        messages: options.messages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
  } catch (error) {
    console.error("[IDA session memory]", error);
  }
}

export async function loadSessionMessages(
  sessionId: string,
): Promise<ConversationMessage[]> {
  if (!isSupabaseConfigured() || !sessionId) return [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_chat_sessions")
      .select("messages")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error || !data) return [];

    const row = data as SessionRow;
    return Array.isArray(row.messages) ? row.messages : [];
  } catch (error) {
    console.error("[IDA session load]", error);
    return [];
  }
}