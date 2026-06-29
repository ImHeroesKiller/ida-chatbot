"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Crosshair,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import type { MapTool } from "@/components/chat/tools/map/use-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  formatMapCoordinates,
  formatMapCoordinatesWithLabel,
} from "@/lib/map-format";
import type { MapMarker } from "@/lib/map-types";
import { cn } from "@/lib/utils";

interface MapMarkerListProps {
  map: MapTool;
  labels: {
    markerLabel: string;
    removeMarker: string;
    copyCoordinates: string;
    copiedCoordinates: string;
    centerMarker: string;
    editMarker: string;
    saveMarker: string;
    cancelEdit: string;
    coordinatesLabel: string;
  };
}

export function MapMarkerList({ map, labels }: MapMarkerListProps) {
  const { viewState } = map;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");

  useEffect(() => {
    if (
      editingId &&
      !viewState.markers.some((marker) => marker.id === editingId)
    ) {
      setEditingId(null);
      setDraftLabel("");
    }
  }, [editingId, viewState.markers]);

  const startEdit = (marker: MapMarker) => {
    setEditingId(marker.id);
    setDraftLabel(marker.label ?? "");
    map.selectMarker(marker.id);
  };

  const saveEdit = (markerId: string) => {
    map.updateMarker(markerId, { label: draftLabel });
    setEditingId(null);
    setDraftLabel("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftLabel("");
  };

  const copyMarker = async (marker: MapMarker) => {
    const text = formatMapCoordinatesWithLabel(marker.label, marker.lat, marker.lng);

    try {
      await navigator.clipboard.writeText(text);
      toast.success(labels.copiedCoordinates);
    } catch {
      toast.error(labels.copyCoordinates);
    }
  };

  if (viewState.markers.length === 0) return null;

  return (
    <ScrollArea className="max-h-48 shrink-0 border-t">
      <ul className="space-y-1.5 p-3">
        {viewState.markers.map((marker) => {
          const isSelected = viewState.selectedMarkerId === marker.id;
          const isEditing = editingId === marker.id;

          return (
            <li
              key={marker.id}
              className={cn(
                "rounded-lg border bg-card px-2.5 py-2 transition-colors",
                isSelected && "border-primary/40 bg-primary/5",
              )}
            >
              <div className="flex items-start gap-2">
                <MapPin
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                />

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <Input
                      value={draftLabel}
                      onChange={(event) => setDraftLabel(event.target.value)}
                      className="mb-1.5 h-7 text-xs"
                      aria-label={labels.editMarker}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => map.selectMarker(marker.id)}
                    >
                      <p className="truncate text-xs font-medium">
                        {marker.label ?? labels.markerLabel}
                      </p>
                    </button>
                  )}

                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    <span className="text-foreground/70">
                      {labels.coordinatesLabel}:{" "}
                    </span>
                    {formatMapCoordinates(marker.lat, marker.lng)}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="h-6 text-[10px]"
                      onClick={() => saveEdit(marker.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {labels.saveMarker}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-6 text-[10px]"
                      onClick={cancelEdit}
                    >
                      <X className="mr-1 h-3 w-3" />
                      {labels.cancelEdit}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="h-6 text-[10px]"
                      onClick={() => map.centerOnMarker(marker.id)}
                    >
                      <Crosshair className="mr-1 h-3 w-3" />
                      {labels.centerMarker}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="h-6 text-[10px]"
                      onClick={() => void copyMarker(marker)}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {labels.copyCoordinates}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      onClick={() => startEdit(marker)}
                      aria-label={labels.editMarker}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => map.removeMarker(marker.id)}
                      aria-label={labels.removeMarker}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}