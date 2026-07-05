// Enterprise Memory - Memori kolektif organisasi
export interface EnterpriseMemory {
  id: string;
  content: string;
  context: string;
  createdAt: string;
}

export interface MemoryQuery {
  context?: string;
  keyword?: string;
}
