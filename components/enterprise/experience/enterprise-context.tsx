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

import { GMAIL_ERRORS, mapGmailQueryError } from "@/lib/api/errors";
import type { RealityViewModel } from "@/lib/enterprise/reality-adapter";

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
  faqOpen: boolean;
  reality: RealityViewModel | null;
  realityLoading: boolean;
  navigate: (target: NavigationTarget) => void;
  openSearch: (query?: string) => void;
  closeSearch: () => void;
  openFaq: () => void;
  closeFaq: () => void;
  setSearchQuery: (query: string) => void;
  navigateToEntity: (type: EntityType, id: string) => void;
  refreshReality: () => Promise<void>;
  gmailNotice: {
    message: string;
    suggestion: string;
    requestId?: string;
    tone: "error" | "success";
  } | null;
  clearGmailNotice: () => void;
};

const EnterpriseContext = createContext<EnterpriseContextValue | null>(null);

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<EnterpriseView>("import");
  const [entityId, setEntityId] = useState<string | null>(null);
  const [memoryTab, setMemoryTab] = useState<MemoryTab>("communications");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [faqOpen, setFaqOpen] = useState(false);
  const [reality, setReality] = useState<RealityViewModel | null>(null);
  const [realityLoading, setRealityLoading] = useState(true);
  const [gmailNotice, setGmailNotice] = useState<{
    message: string;
    suggestion: string;
    requestId?: string;
    tone: "error" | "success";
  } | null>(null);

  const refreshReality = useCallback(async () => {
    setRealityLoading(true);
    try {
      const res = await fetch("/api/reality/state");
      const data = await res.json();
      if (data.success) {
        setReality(data as RealityViewModel);
      }
    } finally {
      setRealityLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshReality();
  }, [refreshReality]);

  const clearGmailNotice = useCallback(() => setGmailNotice(null), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailError = params.get("gmail_error");
    const requestId = params.get("requestId") ?? undefined;

    if (gmailError) {
      const code = mapGmailQueryError(gmailError);
      const spec = GMAIL_ERRORS[code];
      setGmailNotice({
        tone: "error",
        message: spec.message,
        suggestion: spec.suggestion,
        requestId,
      });
      window.history.replaceState({}, "", "/demo");
      return;
    }

    if (params.get("gmail_connected") === "1") {
      setGmailNotice({
        tone: "success",
        message: "Gmail connected successfully. Syncing emails…",
        suggestion: "Your dashboard will update in a few seconds.",
        requestId,
      });
      fetch("/api/reality/gmail-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
        .then(() => refreshReality())
        .then(() => {
          setGmailNotice({
            tone: "success",
            message: "Gmail emails imported.",
            suggestion: "Open Executive Brief or Timeline to see live updates.",
            requestId,
          });
        })
        .catch(() => {
          setGmailNotice({
            tone: "error",
            message: "Gmail connected but sync failed.",
            suggestion: "Try Load demo emails or check Debug Dashboard.",
            requestId,
          });
        })
        .finally(() => {
          window.history.replaceState({}, "", "/demo");
        });
    }
  }, [refreshReality]);

  const navigate = useCallback((target: NavigationTarget) => {
    setView(target.view);
    setEntityId(target.entityId ?? null);
    if (target.memoryTab) setMemoryTab(target.memoryTab);
    setSearchOpen(false);
    setFaqOpen(false);
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

  const openFaq = useCallback(() => {
    setFaqOpen(true);
  }, []);

  const closeFaq = useCallback(() => {
    setFaqOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      view,
      entityId,
      memoryTab,
      searchOpen,
      searchQuery,
      faqOpen,
      reality,
      realityLoading,
      navigate,
      openSearch,
      closeSearch,
      openFaq,
      closeFaq,
      setSearchQuery,
      navigateToEntity,
      refreshReality,
      gmailNotice,
      clearGmailNotice,
    }),
    [
      view,
      entityId,
      memoryTab,
      searchOpen,
      searchQuery,
      faqOpen,
      reality,
      realityLoading,
      navigate,
      openSearch,
      closeSearch,
      openFaq,
      closeFaq,
      navigateToEntity,
      refreshReality,
      gmailNotice,
      clearGmailNotice,
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