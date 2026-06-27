import type { Metadata } from "next";

import { AgentRoom } from "@/components/agent/agent-room";
import { ChatProvider } from "@/components/chat/chat-provider";

export const metadata: Metadata = {
  title: "AgentFlow AI",
  description:
    "Stateful agentic workflow automation with human-in-the-loop — IDA v2.0",
};

export default function AgentPage() {
  return (
    <ChatProvider defaultLocale="id">
      <AgentRoom />
    </ChatProvider>
  );
}