export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

export interface MapViewState {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  /** Persisted selection for marker list / research actions. */
  selectedMarkerId?: string | null;
}

export const DEFAULT_MAP_VIEW: MapViewState = {
  center: { lat: -6.2088, lng: 106.8456 },
  zoom: 11,
  markers: [
    {
      id: "jakarta",
      lat: -6.2088,
      lng: 106.8456,
      label: "Jakarta",
    },
  ],
};

export function createMapMarkerId(): string {
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Immutable default map view (safe to pass to React state). */
export function createDefaultMapViewState(): MapViewState {
  return {
    ...DEFAULT_MAP_VIEW,
    center: { ...DEFAULT_MAP_VIEW.center },
    markers: DEFAULT_MAP_VIEW.markers.map((marker) => ({ ...marker })),
    selectedMarkerId: null,
  };
}

export function normalizeMapViewState(
  state: Partial<MapViewState> | null | undefined,
): MapViewState {
  if (!state) return createDefaultMapViewState();

  const markers = Array.isArray(state.markers)
    ? state.markers.filter(
        (marker) =>
          Number.isFinite(marker.lat) && Number.isFinite(marker.lng),
      )
    : [...DEFAULT_MAP_VIEW.markers];

  const selectedMarkerId =
    state.selectedMarkerId &&
    markers.some((marker) => marker.id === state.selectedMarkerId)
      ? state.selectedMarkerId
      : null;

  return {
    center: state.center ?? DEFAULT_MAP_VIEW.center,
    zoom: state.zoom ?? DEFAULT_MAP_VIEW.zoom,
    markers,
    selectedMarkerId,
  };
}

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula: great-circle distance in kilometers between two lat/lng points.
 * Used for map location cards and distance estimates in chat.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 0;
  }
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Rough travel time estimate (minutes) given distance in km.
 * Default avg speed ~45 km/h for mixed urban driving (tunable).
 */
export function estimateTravelTimeMin(
  distanceKm: number,
  avgSpeedKmh = 45,
): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export interface MapDistanceInfo {
  distanceKm: number;
  estMinutes: number;
}
