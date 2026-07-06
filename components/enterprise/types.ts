export type OrganizationNode = {
  id: string;
  name: string;
  role: string;
  health: string;
  comm: number;
  meetings: number;
  invoices: number;
  projects: number;
};

export type PriorityItem = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  meta?: string;
  badge: string;
  tone: "emerald" | "amber" | "red";
  icon: "users" | "briefcase" | "alert";
};

export type QuickAction = {
  id: string;
  title: string;
  description: string;
};

export type MetricItem = {
  id: string;
  value: string;
  label: string;
  tone: "emerald" | "amber" | "default";
};