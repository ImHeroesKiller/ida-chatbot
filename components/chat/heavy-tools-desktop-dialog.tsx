"use client";

import { Laptop } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HEAVY_TOOLS_DESKTOP_NOTICE_EVENT } from "@/lib/client/heavy-tools-desktop";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";

export function HeavyToolsDesktopDialog({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleNotice = () => setOpen(true);
    window.addEventListener(HEAVY_TOOLS_DESKTOP_NOTICE_EVENT, handleNotice);
    return () =>
      window.removeEventListener(HEAVY_TOOLS_DESKTOP_NOTICE_EVENT, handleNotice);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="heavy-tools-desktop-title"
      onClick={() => setOpen(false)}
    >
      <Card
        className="w-full max-w-md shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="space-y-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Laptop className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle id="heavy-tools-desktop-title" className="text-base leading-snug">
            {copy.heavyToolsDesktopTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.heavyToolsDesktopMessage}
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            {copy.heavyToolsDesktopOk}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}