// Decision - Representasi keputusan dalam organisasi
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
