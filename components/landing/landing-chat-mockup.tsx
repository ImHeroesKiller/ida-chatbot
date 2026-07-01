import { Globe, Map, MessageSquare, Send, Settings2 } from "lucide-react";

export function LandingChatMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-md"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-[#F5F5F7] shadow-2xl shadow-primary/10 dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">IDA Chat</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Asisten siap membantu
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Online
          </span>
        </div>

        <div className="space-y-3 px-4 py-5">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm">
            Bantu buatkan draft surat undangan rapat besok pagi.
          </div>
          <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border/40 bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
            Siap! Saya bisa buatkan lewat{" "}
            <span className="font-semibold text-primary">Worksheet</span>. Mau
            format formal atau semi-formal?
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Worksheet", "Web Search", "Research", "Map"].map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border/50 px-3 pb-3 pt-2">
          <div className="flex items-center gap-2 rounded-[1.25rem] border border-border/50 bg-background/90 px-2 py-2 shadow-inner">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground">
              <Settings2 className="size-4" />
            </div>
            <p className="flex-1 text-sm text-muted-foreground/70">
              Ketik pesanmu di sini...
            </p>
            <div className="flex items-center gap-1.5">
              <div className="flex h-8 items-center gap-1 rounded-full bg-blue-500/10 px-2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <Globe className="size-3" />
                ON
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Send className="size-3.5" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Map className="size-3" />
            Tools aktif sesuai kebutuhanmu
          </div>
        </div>
      </div>
    </div>
  );
}