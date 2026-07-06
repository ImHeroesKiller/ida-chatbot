"use client";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";
import { localizeBriefCards } from "@/lib/enterprise/i18n/content";

import {
  getLocalizedWorkers,
  getPerspectiveConfig,
  getWorkerStatus,
  getWorkforceOutputs,
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
  const { messages } = useEnterpriseLocale();

  const workforceInsightReady =
    workforceMemoryAdded &&
    (workforceDemoPhase === "ceo_ready" || workforceDemoPhase === "complete");

  const perspectiveConfig = getPerspectiveConfig(
    perspective,
    messages,
    workforceInsightReady,
  );

  const outputs = getWorkforceOutputs(messages);
  const allWorkers = getLocalizedWorkers(messages);

  const workers = allWorkers.map((worker) => ({
    ...worker,
    status: getWorkerStatus(worker.id, workforceDemoPhase, activeWorkerId),
    visible: perspectiveConfig.activeWorkers.includes(worker.id),
  }));

  const localizedBase = localizeBriefCards(BRIEF_CARDS, messages);
  const briefCards = workforceInsightReady
    ? [outputs.ceoInsight, ...localizedBase]
    : localizedBase;

  const memoryItems = workforceMemoryAdded
    ? [outputs.memoryEntry, ...MEMORY_ITEMS]
    : MEMORY_ITEMS;

  const timeline = workforceMemoryAdded
    ? [outputs.timelineEntry, ...TIMELINE]
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
    messages,
  };
}