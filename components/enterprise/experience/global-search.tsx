"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, FolderKanban, Search, Users, X } from "lucide-react";
import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

import { useEnterprise } from "./enterprise-context";
import { SEARCH_INDEX } from "./mock-data";
import type { SearchResult } from "./types";

const GROUP_ORDER = ["Companies", "People", "Projects", "Memory", "Decisions"] as const;

const groupIcon = {
  Companies: Building2,
  People: Users,
  Projects: FolderKanban,
  Memory: Search,
  Decisions: Search,
};

export function GlobalSearch() {
  const {
    searchOpen,
    searchQuery,
    setSearchQuery,
    closeSearch,
    openSearch,
    navigateToEntity,
    navigate,
  } = useEnterprise();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSearch, openSearch]);

  const grouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? SEARCH_INDEX.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle.toLowerCase().includes(q) ||
            r.group.toLowerCase().includes(q),
        )
      : SEARCH_INDEX;

    return GROUP_ORDER.map((group) => ({
      group,
      items: filtered.filter((r) => r.group === group),
    })).filter((g) => g.items.length > 0);
  }, [searchQuery]);

  function handleSelect(result: SearchResult) {
    if (result.entityType === "memory") {
      navigate({ view: "memory" });
      closeSearch();
      return;
    }
    navigateToEntity(result.entityType, result.entityId);
    closeSearch();
  }

  return (
    <AnimatePresence>
      {searchOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-background/70 p-4 pt-[12vh] backdrop-blur-md sm:p-8"
          onClick={closeSearch}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="enterprise-card-premium w-full max-w-2xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts, stakeholders, initiatives, knowledge…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="enterprise-demo-scroll max-h-[50vh] p-2">
              {grouped.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium">No matching records</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    No accounts, stakeholders, initiatives, or knowledge records match &ldquo;{searchQuery}&rdquo;.
                    Try a company name, project title, or stakeholder email.
                  </p>
                </div>
              ) : (
                grouped.map(({ group, items }) => {
                  const Icon = groupIcon[group];
                  return (
                    <div key={group} className="mb-2">
                      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group}
                      </p>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                          )}
                        >
                          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {item.title}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}