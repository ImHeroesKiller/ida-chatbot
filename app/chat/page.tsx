import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatRoomLazy } from "@/components/chat/chat-room-lazy";

export default function ChatPage() {
  return (
    <ChatProvider defaultLocale="id">
      <ChatRoomLazy />
    </ChatProvider>
  );
}