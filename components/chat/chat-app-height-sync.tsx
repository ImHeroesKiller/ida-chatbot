"use client";

import { useEffect } from "react";

function syncAppHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

export function ChatAppHeightSync() {
  useEffect(() => {
    syncAppHeight();

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncAppHeight);
    viewport?.addEventListener("scroll", syncAppHeight);
    window.addEventListener("resize", syncAppHeight);

    return () => {
      viewport?.removeEventListener("resize", syncAppHeight);
      viewport?.removeEventListener("scroll", syncAppHeight);
      window.removeEventListener("resize", syncAppHeight);
    };
  }, []);

  return null;
}