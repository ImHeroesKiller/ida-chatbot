"use client";

import type { ToolsCoordinator } from "@/components/chat/tools/coordinator-types";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import type { MapGeocodeResult } from "@/lib/map-geocode";
import { createMapMarkerId } from "@/lib/map-types";
import type { ResolvedWorkflowNodeAction } from "@/lib/workflow-actions";
import {
  addGeneratedWorksheetDocument,
  syncWorkspaceLegacyFields,
} from "@/lib/worksheet-workspace";
import type { WorksheetDocument } from "@/lib/worksheet";

export interface WorkflowToolCoordinatorBridge {
  tools: ToolsCoordinator;
  locale: Locale;
  getWorksheetWorkspace: () => WorksheetDocument;
  persistCurrentChat: (
    patch: Partial<
      Pick<
        ChatSession,
        | "worksheet"
        | "worksheetToolEnabled"
        | "activeRightPanel"
        | "mapViewState"
        | "mapEnabled"
      >
    >,
  ) => void;
}

export interface WorkflowClientActionResult {
  success: boolean;
  output: string;
  message: string;
}

async function geocodeLocation(query: string): Promise<MapGeocodeResult | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const response = await fetch(
    `/api/map/geocode?q=${encodeURIComponent(trimmed)}`,
  );
  if (!response.ok) return null;

  const data = (await response.json()) as { results?: MapGeocodeResult[] };
  return data.results?.[0] ?? null;
}

export async function executeClientWorkflowAction(
  bridge: WorkflowToolCoordinatorBridge,
  action: ResolvedWorkflowNodeAction,
  dispatch?: Record<string, string>,
): Promise<WorkflowClientActionResult> {
  const { tools, persistCurrentChat, getWorksheetWorkspace } = bridge;
  const mergedParams = { ...action.params, ...dispatch };

  switch (action.id) {
    case "worksheet_update": {
      const title = mergedParams.title?.trim() || "Workflow output";
      const content =
        mergedParams.content?.trim() ||
        "No worksheet content was provided for this step.";

      tools.activateWorksheet();
      tools.openPanel(tools.worksheet.panelId);

      const streamInput = {
        title,
        content,
        promptSummary: title,
        activate: true as const,
      };

      let nextWorkspace =
        tools.worksheet.createDocumentFromStream(streamInput) ?? null;

      if (!nextWorkspace) {
        const current = getWorksheetWorkspace();
        nextWorkspace = syncWorkspaceLegacyFields({
          ...addGeneratedWorksheetDocument(current, streamInput, {
            activate: true,
          }),
          updatedAt: Date.now(),
          error: undefined,
        });
        tools.worksheet.hydrateFromExternal?.(nextWorkspace);
      }

      tools.worksheet.syncToPersistLayer?.(nextWorkspace);
      persistCurrentChat({
        worksheet: nextWorkspace,
        worksheetToolEnabled: true,
        activeRightPanel: tools.worksheet.panelId,
      });

      return {
        success: true,
        output: content.slice(0, 2000),
        message: `Worksheet updated: "${title}".`,
      };
    }

    case "map_pin": {
      const query = mergedParams.query?.trim();
      let lat = Number.parseFloat(mergedParams.lat ?? "");
      let lng = Number.parseFloat(mergedParams.lng ?? "");

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        if (!query) {
          return {
            success: false,
            output: "",
            message: "Map pin location query is empty.",
          };
        }

        const location = await geocodeLocation(query);
        if (!location) {
          return {
            success: false,
            output: "",
            message: `Could not geocode "${query}".`,
          };
        }

        lat = location.lat;
        lng = location.lng;
      }

      const label =
        mergedParams.label?.trim() ||
        query?.split(",")[0]?.trim() ||
        "Map pin";

      tools.activateMap();
      tools.openPanel(tools.map.panelId);

      const markerId = createMapMarkerId();
      const nextViewState = {
        ...tools.map.viewState,
        markers: [
          ...tools.map.viewState.markers,
          { id: markerId, lat, lng, label },
        ],
        center: { lat, lng },
        zoom: Math.max(tools.map.viewState.zoom, 14),
        selectedMarkerId: markerId,
      };

      tools.map.setViewState(nextViewState);
      persistCurrentChat({
        mapViewState: nextViewState,
        mapEnabled: true,
        activeRightPanel: tools.map.panelId,
      });

      return {
        success: true,
        output: `${label} — ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        message: `Map pin placed: ${label}.`,
      };
    }

    default:
      return {
        success: false,
        output: "",
        message: `Client action "${action.id}" is not supported.`,
      };
  }
}