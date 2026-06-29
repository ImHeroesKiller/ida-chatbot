import { NextResponse } from "next/server";

import { IDA_CONFIG } from "@/lib/config";
import type { MapGeocodeResult } from "@/lib/map-geocode";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import type { IdaChatErrorResponse } from "@/lib/types";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const MAX_QUERY_LENGTH = 200;
const MAX_RESULTS = 8;

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] satisfies MapGeocodeResult[] });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Search query is too long." },
      { status: 400 },
    );
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request) })}:map-geocode`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json<IdaChatErrorResponse>(
        { error: "Too many map search requests. Please wait." },
        { status: 429 },
      );
    }
    throw error;
  }

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(MAX_RESULTS));
  url.searchParams.set("addressdetails", "0");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `${IDA_CONFIG.name}-Chatbot/1.0 (map-geocode)`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json<IdaChatErrorResponse>(
        { error: "Location search failed." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as NominatimSearchItem[];
    const results: MapGeocodeResult[] = data
      .map((item) => {
        const lat = Number.parseFloat(item.lat);
        const lng = Number.parseFloat(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          id: String(item.place_id),
          label: item.display_name,
          lat,
          lng,
        };
      })
      .filter((item): item is MapGeocodeResult => item !== null);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Location search failed." },
      { status: 502 },
    );
  }
}