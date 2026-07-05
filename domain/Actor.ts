// Actor - Entitas yang dapat melakukan atau bertanggung jawab atas Work Item
export interface Actor {
  id: string;
  type: 'human' | 'digital-worker';
  name: string;
  role: string;
}

export interface ActorRole {
  actorId: string;
  roleInWorkItem: string;
}
