"use client";

import dynamic from "next/dynamic";

import { ChatProvider } from "@/components/chat/chat-provider";

const ChatRoom = dynamic(
  () =>
    import("@/components/chat/chat-room").then((mod) => ({
      default: mod.ChatRoom,
    })),
  {
    // Keep server-rendered ChatLcpShell visible until ChatRoom is ready.
    loading: () => null,
  },
);

export function ChatPageClient() {
  return (
    <div className="relative z-[2] flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatProvider defaultLocale="id">
        <ChatRoom />
      </ChatProvider>
    </div>
  );
}