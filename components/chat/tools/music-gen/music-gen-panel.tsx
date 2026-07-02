"use client";

import { Loader2, Music, X } from "lucide-react";

import type { MusicGenTool } from "./use-music-gen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MusicGenPanelProps {
  musicGen?: MusicGenTool;
  onClose: () => void;
  embedded?: boolean;
  className?: string;
}

export function MusicGenPanel({ musicGen, onClose, embedded, className }: MusicGenPanelProps) {
  if (!musicGen) {
    return <div className="p-4 text-sm text-muted-foreground">Music tool not initialized.</div>;
  }
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        embedded ? "w-full border-0" : "relative z-10 w-[min(100%,22rem)] shrink-0 border-l",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Music className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">Music Generation</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 space-y-4 overflow-y-auto min-h-0 flex-1">
        <div className="text-xs rounded bg-amber-500/10 p-2 border border-amber-500/20">
          Music model configurable in Admin → Media Models. Real audio synthesis backend pending.
        </div>

        <Textarea
          value={musicGen.prompt}
          onChange={(e) => musicGen.setPrompt(e.target.value)}
          placeholder="Upbeat lo-fi hiphop with soft piano and vinyl crackle..."
          className="min-h-20"
        />

        <Button onClick={() => void musicGen.generate()} disabled={!musicGen.prompt.trim() || musicGen.isGenerating} className="w-full">
          {musicGen.isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Music (stub)"}
        </Button>

        {musicGen.lastAudioUrl && (
          <div className="rounded border p-3 bg-muted/30">
            <audio controls src={musicGen.lastAudioUrl} className="w-full" />
            <p className="text-[11px] mt-1 text-muted-foreground">Stub audio. Wire to /api/music-gen + selected model.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
