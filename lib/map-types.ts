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