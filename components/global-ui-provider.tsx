"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyUiConfig,
  cacheUiConfig,
  isThemeLocked,
  readCachedUiConfig,
} from "@/lib/ui-config/apply-client";
import { DEFAULT_UI_CONFIG } from "@/lib/ui-config/defaults";
import type { IdaUiConfig } from "@/lib/ui-config/types";

interface GlobalUiContextValue {
  config: IdaUiConfig;
  themeLocked: boolean;
  refresh: () => Promise<void>;
}

const GlobalUiContext = createContext<GlobalUiContextValue | null>(null);

export function GlobalUiProvider({
  children,
  initialConfig,
}: {
  children: ReactNode;
  initialConfig: IdaUiConfig;
}) {
  const [config, setConfig] = useState<IdaUiConfig>(initialConfig);

  const apply = useCallback((next: IdaUiConfig) => {
    setConfig(next);
    applyUiConfig(next);
    cacheUiConfig(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/ui-config", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { config?: IdaUiConfig };
      if (data.config) apply(data.config);
    } catch {
      // ignore
    }
  }, [apply]);

  useEffect(() => {
    const cached = readCachedUiConfig();
    apply(cached ?? initialConfig);
  }, [apply, initialConfig]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo(
    () => ({
      config,
      themeLocked: isThemeLocked(config.theme),
      refresh,
    }),
    [config, refresh],
  );

  return (
    <GlobalUiContext.Provider value={value}>{children}</GlobalUiContext.Provider>
  );
}

export function useGlobalUi(): GlobalUiContextValue {
  const context = useContext(GlobalUiContext);

  if (!context) {
    return {
      config: DEFAULT_UI_CONFIG,
      themeLocked: false,
      refresh: async () => {},
    };
  }

  return context;
}