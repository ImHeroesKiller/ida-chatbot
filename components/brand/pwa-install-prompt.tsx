"use client";

import { Share, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { IdaLogo } from "@/components/brand/ida-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "ida-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function PwaInstallPrompt({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  const canShow = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !isStandalone() && !isDismissedRecently();
  }, []);

  useEffect(() => {
    if (!canShow) return;

    if (isIosSafari()) {
      const timer = window.setTimeout(() => {
        setIosMode(true);
        setVisible(true);
      }, 2500);
      return () => window.clearTimeout(timer);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [canShow]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    setVisible(false);
    setDeferredPrompt(null);
    setIosMode(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setVisible(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install IDA"
      className={cn(
        "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm sm:inset-x-auto sm:right-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <IdaLogo size="sm" className="mt-0.5" />

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold">Pasang IDA</p>

          {iosMode ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Di Safari, ketuk{" "}
              <Share className="inline size-3.5 align-text-bottom" />{" "}
              <strong>Share</strong>, lalu pilih{" "}
              <strong>Add to Home Screen</strong> untuk mengakses IDA seperti
              aplikasi native.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Tambahkan IDA ke layar utama untuk akses cepat, notifikasi, dan
              pengalaman fullscreen.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!iosMode && deferredPrompt && (
              <Button size="sm" onClick={() => void install()}>
                Pasang sekarang
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Nanti
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}