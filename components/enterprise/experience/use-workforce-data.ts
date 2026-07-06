"use client";

import {
  DIGITAL_WORKERS,
  getPerspectiveConfig,
  getWorkerStatus,
  WORKFORCE_CEO_INSIGHT,
  WORKFORCE_MEMORY_ENTRY,
  WORKFORCE_TIMELINE_ENTRY,
} from "./digital-workforce-data";
import { useEnterprise } from "./enterprise-context";
import { BRIEF_CARDS, MEMORY_ITEMS, TIMELINE } from "./mock-data";

export function useWorkforceData() {
  const {
    perspective,
    workforceDemoPhase,
    workforceMemoryAdded,
    activeWorkerId,
  } = useEnterprise();

  const workforceInsightReady =
    workforceMemoryAdded &&
    (workforceDemoPhase === "ceo_ready" || workforceDemoPhase === "complete");

  const perspectiveConfig = getPerspectiveConfig(perspective, workforceInsightReady);

  const workers = DIGITAL_WORKERS.map((worker) => ({
    ...worker,
    status: getWorkerStatus(worker.id, workforceDemoPhase, activeWorkerId),
    visible: perspectiveConfig.activeWorkers.includes(worker.id),
  }));

  const briefCards = workforceInsightReady
    ? [WORKFORCE_CEO_INSIGHT, ...BRIEF_CARDS]
    : BRIEF_CARDS;

  const memoryItems = workforceMemoryAdded
    ? [WORKFORCE_MEMORY_ENTRY, ...MEMORY_ITEMS]
    : MEMORY_ITEMS;

  const timeline = workforceMemoryAdded
    ? [WORKFORCE_TIMELINE_ENTRY, ...TIMELINE]
    : TIMELINE;

  return {
    perspectiveConfig,
    workers,
    briefCards,
    memoryItems,
    timeline,
    workforceInsightReady,
    workforceMemoryAdded,
    workforceDemoPhase,
  };
}