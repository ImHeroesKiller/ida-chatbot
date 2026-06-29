"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { MapGeocodeResult } from "@/lib/map-geocode";
import { cn } from "@/lib/utils";

interface MapLocationSearchProps {
  placeholder: string;
  noResultsLabel: string;
  errorLabel: string;
  onSelect: (result: MapGeocodeResult) => void;
  className?: string;
}

export function MapLocationSearch({
  placeholder,
  noResultsLabel,
  errorLabel,
  onSelect,
  className,
}: MapLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapGeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setError(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/map/geocode?q=${encodeURIComponent(trimmed)}`,
        );
        const data = (await response.json()) as
          | { results: MapGeocodeResult[] }
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : errorLabel,
          );
        }

        setResults("results" in data ? data.results : []);
        setIsOpen(true);
      } catch (err) {
        setResults([]);
        setError(err instanceof Error ? err.message : errorLabel);
        setIsOpen(true);
      } finally {
        setIsSearching(false);
      }
    },
    [errorLabel],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 320);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  const handleSelect = (result: MapGeocodeResult) => {
    setQuery(result.label);
    setIsOpen(false);
    onSelect(result);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0 || error) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="h-8 pl-8 pr-8 text-xs"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {isSearching ? (
          <Loader2 className="absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {isOpen && (results.length > 0 || error || query.trim().length >= 2) ? (
        <ul
          className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {error ? (
            <li className="px-3 py-2 text-xs text-destructive">{error}</li>
          ) : null}

          {!error && results.length === 0 && !isSearching ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {noResultsLabel}
            </li>
          ) : null}

          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-muted/70"
                onClick={() => handleSelect(result)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-2">{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}