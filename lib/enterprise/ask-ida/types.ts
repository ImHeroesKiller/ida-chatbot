export type AskIdaLocale = "en" | "id";

export type SuggestedAction = {
  action: string;
  owner: "Human Workforce" | "Digital Workforce" | "Either";
  priority?: "high" | "medium" | "low";
};

export type AskIdaStructuredAnswer = {
  analysis: string;
  recommendation: string;
  risks?: string;
  suggestedActions: SuggestedAction[];
};

export type AskIdaResponse = {
  success: boolean;
  answer: string;
  structured?: AskIdaStructuredAnswer | null;
  hasLiveData: boolean;
  source: "llm" | "heuristic" | "empty";
  locale: AskIdaLocale;
  error?: string;
};
