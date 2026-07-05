// Work Item - Manifestasi operasional dari komitmen kolektif
export interface WorkItem {
  id: string;
  initiativeId: string;
  context: string;
  owner: string;
  collaborators: string[];
  status: 'draft' | 'active' | 'completed';
  // ...
}

export interface WorkItemContext {
  currentContext: string;
}
