"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  EnterpriseView,
  EntityType,
  MemoryTab,
  NavigationTarget,
} from "./types";

type EnterpriseContextValue = {
  view: EnterpriseView;
  entityId: string | null;
  memoryTab: MemoryTab;
  searchOpen: boolean;
  searchQuery: string;
  navigate: (target: NavigationTarget) => void;
  openSearch: (query?: string) => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  navigateToEntity: (type: EntityType, id: string) => void;
};

const EnterpriseContext = createContext<EnterpriseContextValue | null>(null);

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<EnterpriseView>("executive-brief");
  const [entityId, setEntityId] = useState<string | null>(null);
  const [memoryTab, setMemoryTab] = useState<MemoryTab>("communications");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useCallback((target: NavigationTarget) => {
    setView(target.view);
    setEntityId(target.entityId ?? null);
    if (target.memoryTab) setMemoryTab(target.memoryTab);
    setSearchOpen(false);
  }, []);

  const navigateToEntity = useCallback((type: EntityType, id: string) => {
    const viewMap: Record<EntityType, EnterpriseView> = {
      company: "companies",
      person: "people",
      project: "projects",
    };
    navigate({ view: viewMap[type], entityId: id });
  }, [navigate]);

  const openSearch = useCallback((query = "") => {
    setSearchQuery(query);
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      view,
      entityId,
      memoryTab,
      searchOpen,
      searchQuery,
      navigate,
      openSearch,
      closeSearch,
      setSearchQuery,
      navigateToEntity,
    }),
    [
      view,
      entityId,
      memoryTab,
      searchOpen,
      searchQuery,
      navigate,
      openSearch,
      closeSearch,
      navigateToEntity,
    ],
  );

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
}

export function useEnterprise() {
  const ctx = useContext(EnterpriseContext);
  if (!ctx) throw new Error("useEnterprise must be used within EnterpriseProvider");
  return ctx;
}