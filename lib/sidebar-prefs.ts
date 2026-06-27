"use client";

import { useCallback, useEffect, useState } from "react";

export const SIDEBAR_EXPANDED_KEY = "ida-sidebar-expanded";

export function useSidebarExpanded() {
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      setExpanded(stored === "true");
    } catch {
      setExpanded(false);
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const setExpandedPersisted = useCallback((value: boolean) => {
    setExpanded(value);
    try {
      localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(value));
    } catch {
      // ignore storage errors
    }
  }, []);

  return { expanded, hydrated, toggle, setExpanded: setExpandedPersisted };
}