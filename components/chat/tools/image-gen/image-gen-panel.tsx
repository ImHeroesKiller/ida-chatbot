"use client";

import { Download, ImageIcon as ImageIconLucide, Loader2, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import type { ImageGenResult, ImageGenTool } from "./use-image-gen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ImageGenPanelProps {
  imageGen?: ImageGenTool;
  onClose: () => void;
  embedded?: boolean;
  className?: string;
}

const ASPECT_OPTIONS = [
  { value: "1:1", label: "Square (1:1)", w: 512, h: 512 },
  { value: "16:9", label: "Landscape (16:9)", w: 768, h: 432 },
  { value: "9:16", label: "Portrait (9:16)", w: 512, h: 912 },
];

export function ImageGenPanel({ imageGen, onClose, embedded, className }: ImageGenPanelProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (!imageGen) {
    return <div className="p-4 text-sm text-muted-foreground">Image tool not initialized.</div>;
  }

  const handleGenerate = async () => {
    try {
      await imageGen.generate();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Image generation failed. Check your model configuration and API keys (XAI_API_KEY etc).";
      toast.error(msg);
    }
  };

  const handleUseImage = (result: ImageGenResult) => {
    imageGen.useResultAsAttachment(result);
    // Future: close panel or switch to composer
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `grok-imagine-${prompt.slice(0, 30).replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        embedded ? "w-full border-0" : "relative z-10 w-[min(100%,22rem)] shrink-0 border-l lg:w-[min(100%,24rem)]",
        className,
      )}
      aria-label="Image Generation"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <ImageIconLucide className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">Image Generation</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close panel"
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
        {/* Model selection from Admin DB */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Model (from Admin Media Models)</Label>
          <select
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            value={imageGen.selectedModelId || ""}
            onChange={(e) => imageGen.setSelectedModelId(e.target.value || null)}
            disabled={imageGen.isGenerating || imageGen.availableModels.length === 0}
          >
            <option value="">-- Select a model --</option>
            {imageGen.availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              Manage in <span className="font-mono">Admin → Media Models</span>
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-[10px]" 
              onClick={() => imageGen.loadModels()}
              disabled={imageGen.isGenerating}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-1.5">
          <Label htmlFor="image-prompt" className="text-xs font-medium">Prompt</Label>
          <Textarea
            id="image-prompt"
            value={imageGen.prompt}
            onChange={(e) => imageGen.setPrompt(e.target.value)}
            placeholder="A futuristic city at sunset, cyberpunk style, highly detailed..."
            className="min-h-[88px] resize-y text-sm"
            disabled={imageGen.isGenerating}
          />
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Aspect Ratio</Label>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={imageGen.aspectRatio === opt.value ? "default" : "outline"}
                className="h-8 text-xs px-2.5"
                onClick={() => imageGen.setAspectRatio(opt.value)}
                disabled={imageGen.isGenerating}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {!imageGen.selectedModelId && imageGen.availableModels.length > 0 && (
          <p className="text-[11px] text-amber-600">Select a model from the list above to use a real provider (Grok/Flux). Otherwise falls back to placeholder.</p>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!imageGen.prompt.trim() || imageGen.isGenerating}
          className="w-full"
        >
          {imageGen.isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating with Grok Imagine…
            </>
          ) : (
            <>
              <ImageIconLucide className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {/* Current Result */}
        {imageGen.lastResult && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Result
                <Button variant="ghost" size="icon-sm" onClick={imageGen.clearLastResult}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardTitle>
              <CardDescription className="text-[11px] line-clamp-2">
                {imageGen.lastResult.prompt}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              <div className="relative rounded-md overflow-hidden border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic generated image URL (picsum stub for demo); real prod would use optimized loader */ }
                <img
                  src={imageGen.lastResult.imageUrl}
                  alt={imageGen.lastResult.prompt}
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-2 text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8"
                  onClick={() => handleUseImage(imageGen.lastResult!)}
                >
                  Use in chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => handleDownload(imageGen.lastResult!.imageUrl, imageGen.lastResult!.prompt)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => imageGen.generate(imageGen.lastResult!.prompt)}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="text-[10px] text-muted-foreground">
                {imageGen.lastResult.model} • {imageGen.lastResult.aspectRatio}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History toggle + list */}
        {imageGen.history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              History ({imageGen.history.length}) {showHistory ? "▲" : "▼"}
            </button>
            {showHistory && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {imageGen.history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      imageGen.setPrompt(item.prompt);
                      // optionally set lastResult
                    }}
                    className="block overflow-hidden rounded border hover:ring-1 ring-primary/50"
                    title={item.prompt}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic history thumbnail */ }
                    <img src={item.imageUrl} alt="" className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-[10px] text-muted-foreground">
          Tip: Be descriptive. Add style, lighting, artist references for best Grok Imagine results.
        </div>
      </div>
    </aside>
  );
}
