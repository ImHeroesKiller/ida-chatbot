"use client";

import { useCallback, useMemo, useState } from "react";

import {
  useBaseToolState,
  type BaseToolLifecycle,
  type BaseToolState,
  type ToolHydrationInput,
} from "@/components/chat/tools/base-tool-state";
import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { ToolQuotaState } from "@/components/chat/tools/types";
import {
  createDefaultMapViewState,
  createMapMarkerId,
  estimateTravelTimeMin,
  haversineDistanceKm,
  normalizeMapViewState,
  type MapDistanceInfo,
  type MapMarker,
  type MapViewState,
} from "@/lib/map-types";

import {
  createMapQuotaState,
  MAP_QUOTA_DEFAULTS,
} from "./map-quota";

const PANEL_ID = TOOL_PANEL_IDS.map;
const DEFAULT_MARKER_ZOOM = 14;

export interface MapHydrationInput extends ToolHydrationInput {
  viewState?: MapViewState | null;
}

export type MapMarkerPatch = Partial<Pick<MapMarker, "label" | "lat" | "lng">>;

export type MapTool = BaseToolState &
  BaseToolLifecycle<MapHydrationInput> & {
    viewState: MapViewState;
    /** Placeholder quota state — not enforced until account management exists. */
    quota: ToolQuotaState;
    setViewState: (state: MapViewState) => void;
    addMarkerAt: (lat: number, lng: number, label?: string) => MapMarker;
    addMarkerAtCenter: () => MapMarker;
    updateMarker: (markerId: string, patch: MapMarkerPatch) => void;
    removeMarker: (markerId: string) => void;
    selectMarker: (markerId: string | null) => void;
    centerOn: (lat: number, lng: number, zoom?: number) => void;
    centerOnMarker: (markerId: string) => void;
    syncView: (center: { lat: number; lng: number }, zoom: number) => void;
    resetView: () => void;
    /** Distance + est. time between two markers (for chat cards & UI). */
    getDistanceBetween: (markerId1: string, markerId2: string) => MapDistanceInfo | null;
    /** Convenience for first pair (or null). Used by marker list + chat cards. */
    getFirstPairDistance: () => { labels: [string, string]; info: MapDistanceInfo } | null;
  };

function buildMarkerLabel(count: number, custom?: string): string {
  const trimmed = custom?.trim();
  if (trimmed) return trimmed;
  return `Marker ${count}`;
}

/**
 * Map tool hook — implements `BaseToolState` and is registered via
 * `useToolsCoordinator` → `useToolRuntime`. Multiple tools may stay armed;
 * the coordinator only enforces exclusive sidebar panels.
 *
 * View state is persisted on `ChatSession.mapViewState`.
 */
export function useMap(): MapTool {
  const [quota, setQuota] = useState<ToolQuotaState>(createMapQuotaState);
  const [viewState, setViewStateInternal] = useState<MapViewState>(
    createDefaultMapViewState,
  );

  const setViewState = useCallback((state: MapViewState) => {
    setViewStateInternal(normalizeMapViewState(state));
  }, []);

  const resetViewState = useCallback(() => {
    setViewStateInternal(createDefaultMapViewState());
  }, []);

  const resetQuota = useCallback(() => {
    setQuota(createMapQuotaState());
  }, []);

  const incrementQuotaUsage = useCallback(() => {
    // TODO: Integrate with admin account management for per-user quota
    if (!MAP_QUOTA_DEFAULTS.enabled) return;
    setQuota((current) => ({
      ...current,
      used: current.used + 1,
    }));
  }, []);

  const hydrateViewState = useCallback((state: MapHydrationInput) => {
    setViewStateInternal(normalizeMapViewState(state.viewState));
  }, []);

  const {
    panelId,
    isEnabled,
    isPanelOpen,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    hydrate,
    resetForNewChat,
  } = useBaseToolState<MapHydrationInput>(PANEL_ID, {
    onHydrate: hydrateViewState,
    onReset: () => {
      resetViewState();
      resetQuota();
    },
  });

  const updateViewState = useCallback(
    (updater: (prev: MapViewState) => MapViewState) => {
      setViewStateInternal((prev) => normalizeMapViewState(updater(prev)));
    },
    [],
  );

  const addMarkerAt = useCallback(
    (lat: number, lng: number, label?: string) => {
      let marker!: MapMarker;

      updateViewState((prev) => {
        marker = {
          id: createMapMarkerId(),
          lat,
          lng,
          label: buildMarkerLabel(prev.markers.length + 1, label),
        };
        return {
          ...prev,
          markers: [...prev.markers, marker],
          selectedMarkerId: marker.id,
        };
      });

      incrementQuotaUsage();
      return marker;
    },
    [incrementQuotaUsage, updateViewState],
  );

  const addMarkerAtCenter = useCallback(() => {
    let marker!: MapMarker;

    updateViewState((prev) => {
      marker = {
        id: createMapMarkerId(),
        lat: prev.center.lat,
        lng: prev.center.lng,
        label: buildMarkerLabel(prev.markers.length + 1),
      };
      return {
        ...prev,
        markers: [...prev.markers, marker],
        selectedMarkerId: marker.id,
      };
    });

    incrementQuotaUsage();
    return marker;
  }, [incrementQuotaUsage, updateViewState]);

  const updateMarker = useCallback(
    (markerId: string, patch: MapMarkerPatch) => {
      updateViewState((prev) => ({
        ...prev,
        markers: prev.markers.map((marker) =>
          marker.id === markerId
            ? {
                ...marker,
                ...(patch.label !== undefined
                  ? { label: patch.label.trim() || marker.label }
                  : {}),
                ...(patch.lat !== undefined ? { lat: patch.lat } : {}),
                ...(patch.lng !== undefined ? { lng: patch.lng } : {}),
              }
            : marker,
        ),
      }));
    },
    [updateViewState],
  );

  const removeMarker = useCallback(
    (markerId: string) => {
      updateViewState((prev) => ({
        ...prev,
        markers: prev.markers.filter((marker) => marker.id !== markerId),
        selectedMarkerId:
          prev.selectedMarkerId === markerId ? null : prev.selectedMarkerId,
      }));
    },
    [updateViewState],
  );

  const selectMarker = useCallback(
    (markerId: string | null) => {
      updateViewState((prev) => ({
        ...prev,
        selectedMarkerId: markerId,
      }));
    },
    [updateViewState],
  );

  const centerOn = useCallback(
    (lat: number, lng: number, zoom = DEFAULT_MARKER_ZOOM) => {
      updateViewState((prev) => ({
        ...prev,
        center: { lat, lng },
        zoom,
      }));
    },
    [updateViewState],
  );

  const centerOnMarker = useCallback(
    (markerId: string) => {
      updateViewState((prev) => {
        const marker = prev.markers.find((item) => item.id === markerId);
        if (!marker) return prev;
        return {
          ...prev,
          center: { lat: marker.lat, lng: marker.lng },
          zoom: Math.max(prev.zoom, DEFAULT_MARKER_ZOOM),
          selectedMarkerId: markerId,
        };
      });
    },
    [updateViewState],
  );

  const syncView = useCallback(
    (center: { lat: number; lng: number }, zoom: number) => {
      updateViewState((prev) => ({
        ...prev,
        center,
        zoom,
      }));
    },
    [updateViewState],
  );

  const resetView = useCallback(() => {
    resetViewState();
  }, [resetViewState]);

  const getDistanceBetween = useCallback(
    (markerId1: string, markerId2: string): MapDistanceInfo | null => {
      const m1 = viewState.markers.find((m) => m.id === markerId1);
      const m2 = viewState.markers.find((m) => m.id === markerId2);
      if (!m1 || !m2) return null;
      const distanceKm = haversineDistanceKm(m1.lat, m1.lng, m2.lat, m2.lng);
      const estMinutes = estimateTravelTimeMin(distanceKm);
      return { distanceKm, estMinutes };
    },
    [viewState.markers],
  );

  const getFirstPairDistance = useCallback((): { labels: [string, string]; info: MapDistanceInfo } | null => {
    const ms = viewState.markers;
    if (ms.length < 2) return null;
    const info = getDistanceBetween(ms[0].id, ms[1].id);
    if (!info) return null;
    return {
      labels: [
        ms[0].label?.trim() || "A",
        ms[1].label?.trim() || "B",
      ],
      info,
    };
  }, [viewState.markers, getDistanceBetween]);

  const quotaSnapshot = useMemo(() => ({ ...quota }), [quota]);

  return {
    panelId,
    isEnabled,
    isPanelOpen,
    viewState,
    quota: quotaSnapshot,
    setEnabled,
    toggleTool,
    openPanel,
    closePanel,
    setViewState,
    addMarkerAt,
    addMarkerAtCenter,
    updateMarker,
    removeMarker,
    selectMarker,
    centerOn,
    centerOnMarker,
    syncView,
    resetView,
    hydrate,
    resetForNewChat,
    getDistanceBetween,
    getFirstPairDistance,
  };
}