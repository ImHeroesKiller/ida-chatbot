// Types owned by Decision concept
export type DecisionStatus = 'Draft' | 'Pending' | 'Decided' | 'Cancelled';

export interface CreateDecisionInput {
  title: string;
  description?: string;
  requestedBy: string;
  decisionMaker?: string;
  workItemId?: string;
  initiativeId?: string;
  contextId?: string;
}

export interface UpdateDecisionInput {
  title?: string;
  description?: string;
  status?: DecisionStatus;
  decisionMaker?: string;
  decidedAt?: string;
}
