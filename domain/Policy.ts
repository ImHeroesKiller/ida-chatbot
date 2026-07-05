// Policy - Aturan yang mengatur bagaimana pekerjaan dilakukan
export interface Policy {
  id: string;
  name: string;
  appliesTo: string[];
}

export interface PolicyEvaluation {
  policyId: string;
  isCompliant: boolean;
  reason?: string;
}
