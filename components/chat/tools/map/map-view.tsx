"use client";

import { useEffect, useRef } from "react";

import type { MapViewState } from "@/lib/map-types";
import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

interface MapViewProps {
  viewState: MapViewState;
  selectedMarkerId?: string | null;
  addMarkerOnClick?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: string) => void;
  onViewChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  className?: string;
}

export function MapView({
  viewState,
  selectedMarkerId = null,
  addMarkerOnClick = false,
  onMapClick,
  onMarkerClick,
  onViewChange,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const skipViewSyncRef = useRef(false);
  const initialViewRef = useRef({
    centerLat: viewState.center.lat,
    centerLng: viewState.center.lng,
    zoom: viewState.zoom,
  });

  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onViewChangeRef = useRef(onViewChange);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onMarkerClickRef.current = onMarkerClick;
    onViewChangeRef.current = onViewChange;
  }, [onMapClick, onMarkerClick, onViewChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    void import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Next.js bundling breaks default marker asset paths.
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center: [initialViewRef.current.centerLat, initialViewRef.current.centerLng],
        zoom: initialViewRef.current.zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      map.on("click", (event) => {
        onMapClickRef.current?.(event.latlng.lat, event.latlng.lng);
      });

      map.on("moveend", () => {
        if (skipViewSyncRef.current) {
          skipViewSyncRef.current = false;
          return;
        }

        const center = map.getCenter();
        onViewChangeRef.current?.(
          { lat: center.lat, lng: center.lng },
          map.getZoom(),
        );
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    skipViewSyncRef.current = true;
    map.setView([viewState.center.lat, viewState.center.lng], viewState.zoom, {
      animate: true,
    });
  }, [viewState.center.lat, viewState.center.lng, viewState.zoom]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    void import("leaflet").then((L) => {
      layer.clearLayers();

      for (const marker of viewState.markers) {
        const isSelected = marker.id === selectedMarkerId;
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          zIndexOffset: isSelected ? 1000 : 0,
        });

        const label = marker.label?.trim();
        if (label) {
          leafletMarker.bindPopup(label, { closeButton: false });
          if (isSelected) {
            leafletMarker.openPopup();
          }
        }

        leafletMarker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          onMarkerClickRef.current?.(marker.id);
        });

        leafletMarker.addTo(layer);
      }
    });
  }, [selectedMarkerId, viewState.markers]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full min-h-[16rem] w-full rounded-xl",
        addMarkerOnClick && "cursor-crosshair",
        className,
      )}
      aria-label="Map"
    />
  );
}