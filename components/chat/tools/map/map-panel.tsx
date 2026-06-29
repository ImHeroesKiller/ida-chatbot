"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Map, MapPin, PanelRightClose, Plus, RotateCcw } from "lucide-react";

import { MapLocationSearch } from "@/components/chat/tools/map/map-location-search";
import { MapMarkerList } from "@/components/chat/tools/map/map-marker-list";
import type { MapTool } from "@/components/chat/tools/map/use-map";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { MapGeocodeResult } from "@/lib/map-geocode";
import { cn } from "@/lib/utils";

const MapView = dynamic(
  () =>
    import("@/components/chat/tools/map/map-view").then((mod) => ({
      default: mod.MapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[16rem] items-center justify-center rounded-xl border border-dashed bg-muted/20">
        <p className="text-xs text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
);

interface MapPanelProps {
  locale: Locale;
  map: MapTool;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

export function MapPanel({
  locale,
  map,
  onClose,
  className,
  embedded = false,
}: MapPanelProps) {
  const copy = COPY[locale];
  const [addMarkerOnClick, setAddMarkerOnClick] = useState(false);

  const handleLocationSelect = useCallback(
    (result: MapGeocodeResult) => {
      map.centerOn(result.lat, result.lng);
      map.addMarkerAt(result.lat, result.lng, result.label);
    },
    [map],
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!addMarkerOnClick) return;
      map.addMarkerAt(lat, lng);
    },
    [addMarkerOnClick, map],
  );

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-background",
        embedded ? "w-full" : "relative z-10 w-[min(100%,22rem)] shrink-0",
        className,
      )}
      aria-label={copy.toolsMap}
      role="complementary"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Map className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {copy.toolsMap}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.rightSidebarClose}
          title={copy.rightSidebarClose}
          className="h-8 w-8 shrink-0"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="shrink-0 space-y-2 border-b px-3 py-2">
        <MapLocationSearch
          placeholder={copy.mapSearchPlaceholder}
          noResultsLabel={copy.mapSearchNoResults}
          errorLabel={copy.mapSearchError}
          onSelect={handleLocationSelect}
        />

        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={addMarkerOnClick ? "default" : "outline"}
            size="xs"
            className="h-7 text-[10px]"
            onClick={() => setAddMarkerOnClick((prev) => !prev)}
            title={copy.mapClickToAddHint}
          >
            <MapPin className="mr-1 h-3 w-3" />
            {copy.mapClickToAdd}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 text-[10px]"
            onClick={() => map.addMarkerAtCenter()}
          >
            <Plus className="mr-1 h-3 w-3" />
            {copy.mapAddMarker}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 text-[10px]"
            onClick={() => map.resetView()}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            {copy.mapResetView}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3">
        <MapView
          viewState={map.viewState}
          selectedMarkerId={map.viewState.selectedMarkerId}
          addMarkerOnClick={addMarkerOnClick}
          onMapClick={handleMapClick}
          onMarkerClick={(markerId) => map.selectMarker(markerId)}
          onViewChange={(center, zoom) => map.syncView(center, zoom)}
          className="border shadow-sm"
        />
      </div>

      <MapMarkerList
        map={map}
        labels={{
          markerLabel: copy.mapMarkerLabel,
          removeMarker: copy.mapRemoveMarker,
          copyCoordinates: copy.mapCopyCoordinates,
          copiedCoordinates: copy.mapCopiedCoordinates,
          centerMarker: copy.mapCenterMarker,
          editMarker: copy.mapEditMarker,
          saveMarker: copy.mapSaveMarker,
          cancelEdit: copy.mapCancelEdit,
          coordinatesLabel: copy.mapCoordinatesLabel,
        }}
      />
    </aside>
  );
}