import { ChatLcpShell } from "@/components/chat/chat-lcp-shell";
import { ChatPageClient } from "@/components/chat/chat-page-client";

export default function ChatPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatLcpShell />
      <ChatPageClient />
    </div>
  );
}