export type EnterpriseView =
  | "overview"
  | "organization"
  | "people"
  | "companies"
  | "projects"
  | "memory"
  | "workforce"
  | "ask-ida"
  | "import"
  | "why-ida"
  | "executive-brief"
  | "timeline"
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

export type PerspectiveId = "ceo" | "cfo" | "sales" | "project" | "hr";

export type WorkforceDemoPhase =
  | "idle"
  | "analyst_working"
  | "memory_updated"
  | "ceo_ready"
  | "complete";

export type DigitalWorkerStatus = "idle" | "working" | "completed";

export interface DigitalWorker {
  id: string;
  name: string;
  specialty: string;
  description: string;
  perspectives: PerspectiveId[];
  accent: string;
}

export interface PerspectiveMetric {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
}

export interface PerspectiveFocusCard {
  id: string;
  title: string;
  description: string;
  metric?: string;
  entityType?: EntityType;
  entityId?: string;
  tone?: BriefItemTone;
}

export interface PerspectiveConfig {
  id: PerspectiveId;
  label: string;
  title: string;
  greeting: string;
  description: string;
  metrics: PerspectiveMetric[];
  focusCards: PerspectiveFocusCard[];
  activeWorkers: string[];
}

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
  workforce?: boolean;
}

export interface BriefCard {
  id: string;
  tone: BriefItemTone;
  title: string;
  description: string;
  entityType?: EntityType;
  entityId?: string;
  metric?: string;
  workforce?: boolean;
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