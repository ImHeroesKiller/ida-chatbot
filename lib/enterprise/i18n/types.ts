export type EnterpriseLocale = "en" | "id";

export type VocabularyKey =
  | "organizationMemory"
  | "executiveBrief"
  | "knowledge"
  | "accounts"
  | "stakeholders"
  | "initiatives"
  | "digitalWorkforce"
  | "attentionItems"
  | "pipeline"
  | "account"
  | "stakeholder"
  | "initiative"
  | "liveData"
  | "preview"
  | "presentationMode"
  | "internalMode";

export type EnterpriseMessages = {
  enterprise: Record<string, unknown>;
  workforce: Record<string, unknown>;
  vocabulary: Record<VocabularyKey, string>;
  ask: Record<string, unknown>;
  content: Record<string, unknown>;
  askResponses: Record<string, string>;
  views: Record<string, unknown>;
  narrative: Record<string, unknown>;
};