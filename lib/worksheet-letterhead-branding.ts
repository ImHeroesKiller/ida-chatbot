"use client";

import { useEffect, useMemo, useState } from "react";

import { useWorksheetBrandingPrefs } from "@/lib/worksheet-branding-prefs";
import {
  resolveWorksheetLetterheadBranding,
  type WorksheetBrandingSource,
  type WorksheetLetterheadSelection,
  type WorksheetLetterheadTemplate,
} from "@/lib/worksheet-letterhead-template";

async function fetchLetterheadTemplates(): Promise<
  WorksheetLetterheadTemplate[]
> {
  try {
    const response = await fetch("/api/worksheet/letterhead-templates", {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      templates?: WorksheetLetterheadTemplate[];
    };

    return data.templates ?? [];
  } catch {
    return [];
  }
}

export function useResolvedWorksheetBranding(
  selection: WorksheetLetterheadSelection,
) {
  const personal = useWorksheetBrandingPrefs();
  const [templates, setTemplates] = useState<WorksheetLetterheadTemplate[]>([]);
  const [templatesHydrated, setTemplatesHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await fetchLetterheadTemplates();
      if (cancelled) return;
      setTemplates(loaded);
      setTemplatesHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = useMemo(
    () =>
      resolveWorksheetLetterheadBranding({
        selection,
        templates,
        personalBranding: personal.prefs,
        legacyAdminBranding: personal.adminDefaults,
      }),
    [personal.adminDefaults, personal.prefs, selection, templates],
  );

  return {
    branding: resolved.branding,
    brandingSource: resolved.brandingSource as WorksheetBrandingSource,
    activeTemplate: resolved.activeTemplate,
    templates,
    templatesHydrated,
    personalPrefs: personal.prefs,
    personalHydrated: personal.hydrated,
    hydrated: personal.hydrated && templatesHydrated,
    updatePersonalPrefs: personal.updatePrefs,
    resetPersonalPrefs: personal.resetPrefs,
  };
}