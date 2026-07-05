// Types owned by Decision concept
export interface Decision {
  id: string;
  title: string;
  description?: string;
  status: 'Draft' | 'Pending' | 'Decided' | 'Cancelled';
  requestedBy: string;
  decisionMaker?: string;
  createdAt: string;
  decidedAt?: string;
  workItemId?: string;
  initiativeId?: string;
  contextId?: string;
}

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
