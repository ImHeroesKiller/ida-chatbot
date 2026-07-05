// Types owned by Enterprise Memory concept
export interface MemoryQuery {
  context?: string;
  keyword?: string;
  limit?: number;
}

export interface EnterpriseMemory {
  id: string;
  content: string;
  context: string;
  createdAt: string;
}
