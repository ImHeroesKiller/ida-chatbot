"use client";

import { useCallback, useEffect, useState } from "react";

import { IDA_CONFIG } from "@/lib/config";

export interface WorksheetBrandingPrefs {
  brandName: string;
  footerText: string;
  logoDataUrl: string | null;
}

const STORAGE_KEY = "ida-worksheet-branding";
const MAX_LOGO_BYTES = 180_000;

export const DEFAULT_WORKSHEET_BRANDING: WorksheetBrandingPrefs = {
  brandName: IDA_CONFIG.name,
  footerText: "Worksheet",
  logoDataUrl: null,
};

function parseStoredBranding(raw: string | null): WorksheetBrandingPrefs {
  if (!raw) return DEFAULT_WORKSHEET_BRANDING;

  try {
    const parsed = JSON.parse(raw) as Partial<WorksheetBrandingPrefs>;
    return {
      brandName: parsed.brandName?.trim() || DEFAULT_WORKSHEET_BRANDING.brandName,
      footerText: parsed.footerText?.trim() || DEFAULT_WORKSHEET_BRANDING.footerText,
      logoDataUrl:
        typeof parsed.logoDataUrl === "string" && parsed.logoDataUrl.startsWith("data:image/")
          ? parsed.logoDataUrl
          : null,
    };
  } catch {
    return DEFAULT_WORKSHEET_BRANDING;
  }
}

export function loadWorksheetBrandingPrefs(): WorksheetBrandingPrefs {
  if (typeof window === "undefined") return DEFAULT_WORKSHEET_BRANDING;
  return parseStoredBranding(window.localStorage.getItem(STORAGE_KEY));
}

export function saveWorksheetBrandingPrefs(prefs: WorksheetBrandingPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useWorksheetBrandingPrefs() {
  const [prefs, setPrefs] = useState<WorksheetBrandingPrefs>(
    DEFAULT_WORKSHEET_BRANDING,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(loadWorksheetBrandingPrefs());
    setHydrated(true);
  }, []);

  const updatePrefs = useCallback((patch: Partial<WorksheetBrandingPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      saveWorksheetBrandingPrefs(next);
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => {
    saveWorksheetBrandingPrefs(DEFAULT_WORKSHEET_BRANDING);
    setPrefs(DEFAULT_WORKSHEET_BRANDING);
  }, []);

  return { prefs, hydrated, updatePrefs, resetPrefs };
}

export async function readLogoFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Logo must be an image file.");
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo file is too large.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read logo file."));
    };
    reader.onerror = () => reject(new Error("Failed to read logo file."));
    reader.readAsDataURL(file);
  });
}