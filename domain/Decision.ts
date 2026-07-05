// Decision - Pilihan penting yang memerlukan human judgment
export interface Decision {
  id: string;
  workItemId: string;
  title: string;
  status: 'proposed' | 'approved' | 'rejected';
  outcome?: string;
}

export interface DecisionOutcome {
  decisionId: string;
  result: string;
}
