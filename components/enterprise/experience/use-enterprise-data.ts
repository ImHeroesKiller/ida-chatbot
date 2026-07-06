"use client";

import { useEnterprise } from "./enterprise-context";
import type { RealityViewModel } from "@/lib/enterprise/reality-adapter";
import { useWorkforceData } from "./use-workforce-data";
import {
  BRIEF_CARDS,
  COMPANIES,
  getCompany,
  getPerson,
  getProject,
  MEMORY_ITEMS,
  PEOPLE,
  PROJECTS,
  SEARCH_INDEX,
  TIMELINE,
} from "./mock-data";
import type {
  BriefCard,
  Company,
  MemoryItem,
  Person,
  Project,
  SearchResult,
  TimelineEvent,
} from "./types";

export function useEnterpriseData() {
  const { reality, realityLoading } = useEnterprise();
  const workforce = useWorkforceData();
  const live = reality?.hasLiveData ?? false;

  const companies: Company[] = live ? reality!.companies : COMPANIES;
  const people: Person[] = live ? reality!.people : PEOPLE;
  const projects: Project[] = live ? reality!.projects : PROJECTS;
  const briefCards: BriefCard[] = live ? reality!.briefCards : workforce.briefCards;
  const timeline: TimelineEvent[] = live ? reality!.timeline : workforce.timeline;
  const memoryItems: MemoryItem[] = live ? reality!.memoryItems : workforce.memoryItems;
  const searchIndex: SearchResult[] = live ? reality!.searchIndex : SEARCH_INDEX;

  function resolveCompany(id: string) {
    if (live) return reality!.companies.find((c) => c.id === id) ?? getCompany(id);
    return getCompany(id);
  }

  function resolvePerson(id: string) {
    if (live) return reality!.people.find((p) => p.id === id) ?? getPerson(id);
    return getPerson(id);
  }

  function resolveProject(id: string) {
    if (live) return reality!.projects.find((p) => p.id === id) ?? getProject(id);
    return getProject(id);
  }

  return {
    live,
    realityLoading,
    reality: reality as RealityViewModel | null,
    companies,
    people,
    projects,
    briefCards,
    timeline,
    memoryItems,
    searchIndex,
    getCompany: resolveCompany,
    getPerson: resolvePerson,
    getProject: resolveProject,
    workforceInsightReady: workforce.workforceInsightReady,
    perspectiveConfig: workforce.perspectiveConfig,
  };
}