import type { MapGeocodeResult } from "@/lib/map-geocode";
import { createMapMarkerId } from "@/lib/map-types";
import type { IdaMessage } from "@/lib/types";

const LOCATION_SPLIT_RE =
  /\s*(?:,|;|\bdan\b|\band\b|\bto\b|\bke\b|\bvs\.?\b|\batau\b|\bor\b)\s*/i;

const LOCATION_INTENT_RE =
  /\b(lokasi|alamat|dimana|di mana|where|jarak|distance|route|rute|peta|map|koordinat|coordinates|titik|point|antara|between|dari|from|menuju|towards|near|dekat|sekitar)\b/i;

async function geocodeViaApi(query: string): Promise<MapGeocodeResult | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  try {
    const response = await fetch(
      `/api/map/geocode?q=${encodeURIComponent(trimmed)}`,
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { results?: MapGeocodeResult[] };
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

function normalizeQueryPart(part: string): string | null {
  const cleaned = part
    .replace(
      /^(lokasi|alamat|dimana|di mana|where is|where are|jarak|distance|peta|map|koordinat|titik|point|antara|between|dari|from|menuju|to|ke)\s+/i,
      "",
    )
    .replace(/\?+$/, "")
    .trim();

  if (cleaned.length < 2 || cleaned.length > 120) return null;
  if (!/[a-zA-Z\u00C0-\u024F\u4E00-\u9FFF]/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Extract candidate location names from a user message (e.g. "Jakarta dan Bandung").
 */
export function extractLocationQueries(userMessage: string): string[] {
  const text = userMessage.trim();
  if (!text || !LOCATION_INTENT_RE.test(text)) return [];

  const parts = text
    .split(LOCATION_SPLIT_RE)
    .map(normalizeQueryPart)
    .filter((part): part is string => Boolean(part));

  if (parts.length > 0) {
    return [...new Set(parts)].slice(0, 4);
  }

  const fallback = normalizeQueryPart(text);
  return fallback ? [fallback] : [];
}

/**
 * Geocode location queries and build mapLocations for chat cards.
 */
export async function resolveMapLocationsFromChat(
  userMessage: string,
): Promise<NonNullable<IdaMessage["mapLocations"]>> {
  const queries = extractLocationQueries(userMessage);
  if (!queries.length) return [];

  const locations: NonNullable<IdaMessage["mapLocations"]> = [];

  for (const query of queries) {
    const result = await geocodeViaApi(query);
    if (!result) continue;

    locations.push({
      id: result.id || createMapMarkerId(),
      lat: result.lat,
      lng: result.lng,
      label: result.label,
    });
  }

  return locations;
}