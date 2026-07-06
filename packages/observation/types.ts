import type { Representation } from "@ida/representation";

export type BusinessArtifactType =
  | "Invoice"
  | "Meeting"
  | "Proposal"
  | "Complaint"
  | "Purchase Order"
  | "Contract"
  | "Payment"
  | "Reminder"
  | "Information"
  | "Other";

export type PriorityLevel = "high" | "medium" | "low";

export interface BusinessExtraction {
  company: string | null;
  companyId?: string;
  type: BusinessArtifactType;
  summary: string;
  amount?: number;
  date?: string;
  deadline?: string;
  stakeholder?: string;
  priority?: PriorityLevel;
}

export interface Observation {
  id: string;
  representationId: string;
  representation: Representation;
  observedAt: string;
  extractorVersion: string;
  extraction: BusinessExtraction;
}