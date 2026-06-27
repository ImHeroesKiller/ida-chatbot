import { FloatingChat } from "@/components/chat/floating-chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4 text-center">
          <Badge variant="secondary" className="mx-auto">
            Standalone AI Assistant
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            IDA Chatbot
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Intelligent Digital Assistant — mandiri, ramah profesional,
            multilingual (ID/EN/ZH), dengan RAG, memori percakapan, dan smart
            handoff.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Gemini 3.1 Flash Lite", desc: "Streaming via LangChain" },
            { title: "RAG + pgvector", desc: "Supabase document retrieval" },
            { title: "10-turn memory", desc: "BufferWindowMemory session" },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Klik tombol chat di pojok kanan bawah untuk memulai percakapan.
        </p>
      </main>

      <FloatingChat defaultLocale="id" />
    </div>
  );
}