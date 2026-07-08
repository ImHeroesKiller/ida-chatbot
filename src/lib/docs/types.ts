export type DocumentKind = 'ADR' | 'Blueprint' | 'Guide' | 'Runtime' | 'API' | 'Archive';
export type DocumentStatus = 'Live' | 'Frozen' | 'Archived';
export type DocumentVisibility = 'public' | 'internal';

export interface Document {
  id: string;
  title: string;
  slug: string;
  category: string;
  kind: DocumentKind;
  status: DocumentStatus;
  version: string;
  owner: string;
  visibility: DocumentVisibility;
  order: number;
  tags: string[];
  related: string[];
  filePath: string;
}
