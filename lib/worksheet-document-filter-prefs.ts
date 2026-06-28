"use client";

import {
  DEFAULT_WORKSHEET_DOCUMENT_FILTERS,
  type WorksheetDocumentListFilters,
  type WorksheetDocumentFilterStatus,
  type WorksheetDocumentFilterTime,
} from "@/lib/worksheet-workspace";

const STORAGE_KEY = "ida-worksheet-document-filters-v1";

const VALID_STATUS: WorksheetDocumentFilterStatus[] = [
  "all",
  "generated",
  "edited",
  "exported",
];

const VALID_TIME: WorksheetDocumentFilterTime[] = [
  "all",
  "today",
  "week",
  "month",
];

function parseFilters(raw: string | null): WorksheetDocumentListFilters {
  if (!raw) return DEFAULT_WORKSHEET_DOCUMENT_FILTERS;

  try {
    const parsed = JSON.parse(raw) as Partial<WorksheetDocumentListFilters>;
    return {
      status: VALID_STATUS.includes(parsed.status as WorksheetDocumentFilterStatus)
        ? (parsed.status as WorksheetDocumentFilterStatus)
        : DEFAULT_WORKSHEET_DOCUMENT_FILTERS.status,
      time: VALID_TIME.includes(parsed.time as WorksheetDocumentFilterTime)
        ? (parsed.time as WorksheetDocumentFilterTime)
        : DEFAULT_WORKSHEET_DOCUMENT_FILTERS.time,
    };
  } catch {
    return DEFAULT_WORKSHEET_DOCUMENT_FILTERS;
  }
}

export function loadWorksheetDocumentFilters(): WorksheetDocumentListFilters {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSHEET_DOCUMENT_FILTERS;
  }

  return parseFilters(window.localStorage.getItem(STORAGE_KEY));
}

export function saveWorksheetDocumentFilters(
  filters: WorksheetDocumentListFilters,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}