import { SidebarSkeleton } from "@/components/chat/sidebar-skeleton";

export function ChatRoomSkeleton() {
  return (
    <div
      className="ida-chat-shell flex h-full min-h-0 w-full overflow-hidden bg-background font-sans"
      aria-busy="true"
      aria-label="Loading chat"
    >
      <aside className="hidden h-full w-14 shrink-0 border-r md:flex">
        <SidebarSkeleton expanded={false} />
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2.5 border-b bg-background px-3 sm:gap-3 sm:px-5">
          <div className="size-9 shrink-0 rounded-2xl bg-muted sm:size-10" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted/70" />
          </div>
          <div className="size-7 shrink-0 rounded-lg bg-muted/80" />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          <div className="ida-message-width mx-auto space-y-4">
            <div className="h-40 rounded-2xl border border-dashed bg-muted/20" />
            <div className="h-16 rounded-2xl bg-muted/30" />
          </div>
        </div>

        <div className="shrink-0 border-t px-3 py-3 sm:px-5">
          <div className="ida-message-width mx-auto h-12 rounded-2xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}