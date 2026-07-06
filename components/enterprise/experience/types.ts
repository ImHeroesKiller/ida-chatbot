export type EnterpriseView =
  | "import"
  | "why-ida"
  | "executive-brief"
  | "organization"
  | "companies"
  | "people"
  | "projects"
  | "timeline"
  | "memory"
  | "roadmap"
  | "search"
  | "developer";

export type EntityType = "company" | "person" | "project";

export type MemoryTab =
  | "communications"
  | "meetings"
  | "projects"
  | "commercial"
  | "decisions"
  | "notes";

export type BriefItemTone = "critical" | "opportunity" | "health" | "risk" | "action";

export interface Company {
  id: string;
  name: string;
  sector: string;
  health: number;
  healthLabel: string;
  revenue: string;
  contacts: number;
  activeProjects: number;
  summary: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  companyId: string;
  email: string;
  engagements: number;
  lastActive: string;
  summary: string;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  ownerId: string;
  status: "on-track" | "at-risk" | "stalled";
  budget: string;
  progress: number;
  summary: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  type: "communication" | "meeting" | "decision" | "commercial" | "project";
  entityType?: EntityType;
  entityId?: string;
  summary: string;
}

export interface MemoryItem {
  id: string;
  tab: MemoryTab;
  title: string;
  subtitle: string;
  date: string;
  entityType?: EntityType;
  entityId?: string;
}

export interface BriefCard {
  id: string;
  tone: BriefItemTone;
  title: string;
  description: string;
  entityType?: EntityType;
  entityId?: string;
  metric?: string;
}

export interface SearchResult {
  id: string;
  group: "Companies" | "People" | "Projects" | "Memory" | "Decisions";
  title: string;
  subtitle: string;
  entityType: EntityType | "memory";
  entityId: string;
}

export interface NavigationTarget {
  view: EnterpriseView;
  entityId?: string;
  memoryTab?: MemoryTab;
}