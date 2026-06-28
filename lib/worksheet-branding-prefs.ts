"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_WORKSHEET_BRANDING_CONFIG,
  mergeWorksheetBrandingPrefs,
  type WorksheetBrandingConfig,
} from "@/lib/worksheet-branding-config";

export type WorksheetBrandingPrefs = WorksheetBrandingConfig;

const STORAGE_KEY = "ida-worksheet-branding";
const OVERRIDE_FLAG_KEY = "ida-worksheet-branding-override";
const MAX_LOGO_BYTES = 180_000;

export const DEFAULT_WORKSHEET_BRANDING: WorksheetBrandingPrefs =
  DEFAULT_WORKSHEET_BRANDING_CONFIG;

function parseStoredBranding(raw: string | null): Partial<WorksheetBrandingPrefs> | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<WorksheetBrandingPrefs>;
    return parsed;
  } catch {
    return null;
  }
}

function hasUserOverrideFlag(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OVERRIDE_FLAG_KEY) === "1";
}

function setUserOverrideFlag(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) {
    window.localStorage.setItem(OVERRIDE_FLAG_KEY, "1");
    return;
  }
  window.localStorage.removeItem(OVERRIDE_FLAG_KEY);
}

export function loadWorksheetBrandingPrefs(
  adminDefaults: WorksheetBrandingPrefs = DEFAULT_WORKSHEET_BRANDING,
): WorksheetBrandingPrefs {
  if (typeof window === "undefined") return adminDefaults;

  const stored = parseStoredBranding(window.localStorage.getItem(STORAGE_KEY));
  return mergeWorksheetBrandingPrefs(
    adminDefaults,
    stored,
    hasUserOverrideFlag(),
  );
}

export function saveWorksheetBrandingPrefs(prefs: WorksheetBrandingPrefs): void {
  if (typeof window === "undefined") return;
  setUserOverrideFlag(true);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

async function fetchAdminBrandingDefaults(): Promise<WorksheetBrandingPrefs> {
  try {
    const response = await fetch("/api/worksheet/branding", {
      cache: "no-store",
    });

    if (!response.ok) return DEFAULT_WORKSHEET_BRANDING;

    const data = (await response.json()) as {
      config?: Partial<WorksheetBrandingPrefs>;
    };

    return mergeWorksheetBrandingPrefs(
      DEFAULT_WORKSHEET_BRANDING,
      data.config ?? null,
      false,
    );
  } catch {
    return DEFAULT_WORKSHEET_BRANDING;
  }
}

export function useWorksheetBrandingPrefs() {
  const [prefs, setPrefs] = useState<WorksheetBrandingPrefs>(
    DEFAULT_WORKSHEET_BRANDING,
  );
  const [adminDefaults, setAdminDefaults] = useState<WorksheetBrandingPrefs>(
    DEFAULT_WORKSHEET_BRANDING,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const defaults = await fetchAdminBrandingDefaults();
      if (cancelled) return;

      setAdminDefaults(defaults);
      setPrefs(loadWorksheetBrandingPrefs(defaults));
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updatePrefs = useCallback(
    (patch: Partial<WorksheetBrandingPrefs>) => {
      setPrefs((current) => {
        const next = { ...current, ...patch };
        saveWorksheetBrandingPrefs(next);
        return next;
      });
    },
    [],
  );

  const resetPrefs = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      setUserOverrideFlag(false);
    }
    setPrefs(adminDefaults);
  }, [adminDefaults]);

  return { prefs, adminDefaults, hydrated, updatePrefs, resetPrefs };
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