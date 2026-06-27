"use client";

import { lazy, Suspense } from "react";

import { ChatRoomSkeleton } from "@/components/chat/chat-room-skeleton";

const ChatRoom = lazy(() =>
  import("@/components/chat/chat-room").then((mod) => ({
    default: mod.ChatRoom,
  })),
);

export function ChatRoomLazy() {
  return (
    <Suspense fallback={<ChatRoomSkeleton />}>
      <ChatRoom />
    </Suspense>
  );
}