// Resource - Segala sesuatu yang digunakan untuk menghasilkan outcome
export interface Resource {
  id: string;
  type: string;
  name: string;
  allocatedTo?: string;
}

export interface ResourceAllocation {
  resourceId: string;
  workItemId: string;
  quantity: number;
}
