"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type {
  WorksheetDocumentListFilters,
  WorksheetDocumentFilterStatus,
  WorksheetDocumentFilterTime,
} from "@/lib/worksheet-workspace";
import { cn } from "@/lib/utils";

interface WorksheetDocumentsToolbarProps {
  locale: Locale;
  search: string;
  filters: WorksheetDocumentListFilters;
  shownCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: WorksheetDocumentListFilters) => void;
  className?: string;
}

const selectClassName =
  "h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-[11px] text-foreground sm:flex-none sm:min-w-[7.5rem]";

export function WorksheetDocumentsToolbar({
  locale,
  search,
  filters,
  shownCount,
  totalCount,
  onSearchChange,
  onFiltersChange,
  className,
}: WorksheetDocumentsToolbarProps) {
  const copy = COPY[locale];

  const statusOptions: {
    value: WorksheetDocumentFilterStatus;
    label: string;
  }[] = [
    { value: "all", label: copy.worksheetDocumentsFilterStatusAll },
    { value: "generated", label: copy.worksheetDocumentsFilterStatusGenerated },
    { value: "edited", label: copy.worksheetDocumentsFilterStatusEdited },
    { value: "exported", label: copy.worksheetDocumentsFilterStatusExported },
  ];

  const timeOptions: {
    value: WorksheetDocumentFilterTime;
    label: string;
  }[] = [
    { value: "all", label: copy.worksheetDocumentsFilterTimeAll },
    { value: "today", label: copy.worksheetDocumentsFilterTimeToday },
    { value: "week", label: copy.worksheetDocumentsFilterTimeWeek },
    { value: "month", label: copy.worksheetDocumentsFilterTimeMonth },
  ];

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filters.status !== "all" ||
    filters.time !== "all";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={copy.worksheetDocumentsSearchPlaceholder}
          className="h-9 pl-8 text-sm"
          aria-label={copy.worksheetDocumentsSearchPlaceholder}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          <SlidersHorizontal className="h-3 w-3 shrink-0" />
          <span className="truncate">{copy.worksheetDocumentsFilterLabel}</span>
        </div>
        <div className="flex min-w-0 gap-2">
          <select
            className={selectClassName}
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as WorksheetDocumentFilterStatus,
              })
            }
            aria-label={copy.worksheetDocumentsFilterStatus}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={selectClassName}
            value={filters.time}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                time: event.target.value as WorksheetDocumentFilterTime,
              })
            }
            aria-label={copy.worksheetDocumentsFilterTime}
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {copy.worksheetDocumentsFilterResults
          .replace("{shown}", String(shownCount))
          .replace("{total}", String(totalCount))}
        {hasActiveFilters ? (
          <span className="text-foreground/70">
            {" "}
            · {copy.worksheetDocumentsFilterActive}
          </span>
        ) : null}
      </p>
    </div>
  );
}