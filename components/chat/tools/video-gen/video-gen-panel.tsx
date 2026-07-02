"use client";

import { Loader2, Video, X } from "lucide-react";

import type { VideoGenTool } from "./use-video-gen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface VideoGenPanelProps {
  videoGen?: VideoGenTool;
  onClose: () => void;
  embedded?: boolean;
  className?: string;
}

export function VideoGenPanel({ videoGen, onClose, embedded, className }: VideoGenPanelProps) {
  if (!videoGen) {
    return <div className="p-4 text-sm text-muted-foreground">Video tool not initialized.</div>;
  }
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-background",
        embedded ? "w-full" : "relative z-10 w-[min(100%,22rem)] shrink-0",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Video className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">Video Generation</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 space-y-4 overflow-y-auto min-h-0 flex-1">
        <div className="text-xs rounded bg-amber-500/10 p-2 border border-amber-500/20">
          Model selection for Video Gen is available in Admin → Media Models. Backend generation coming soon.
        </div>

        <Textarea
          value={videoGen.prompt}
          onChange={(e) => videoGen.setPrompt(e.target.value)}
          placeholder="A cat jumping over a fence in slow motion, cinematic..."
          className="min-h-20"
        />

        <Button onClick={() => void videoGen.generate()} disabled={!videoGen.prompt.trim() || videoGen.isGenerating} className="w-full">
          {videoGen.isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Video (stub)"}
        </Button>

        {videoGen.lastResultUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview (stub)</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={videoGen.lastResultUrl} alt="video preview" className="w-full rounded border" />
              <p className="mt-2 text-[11px] text-muted-foreground">Replace with real video player + actual generation result.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}
