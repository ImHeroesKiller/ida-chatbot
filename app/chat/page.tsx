import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatRoom } from "@/components/chat/chat-room";

export default function ChatPage() {
  return (
    <ChatProvider defaultLocale="id">
      <ChatRoom />
    </ChatProvider>
  );
}