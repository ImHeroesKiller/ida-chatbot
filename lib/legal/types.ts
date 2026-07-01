export type LegalBlock =
  | { type: "text"; text: string }
  | { type: "labeled"; label: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "labeledList"; label: string; items: string[] };

export interface LegalSectionContent {
  title: string;
  blocks: LegalBlock[];
}