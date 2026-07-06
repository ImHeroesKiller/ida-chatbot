import type { EnterpriseLocale, EnterpriseMessages } from "./types";

import enAsk from "@/messages/en/ask.json";
import enAskResponses from "@/messages/en/ask-responses.json";
import enContent from "@/messages/en/content.json";
import enEnterprise from "@/messages/en/enterprise.json";
import enNarrative from "@/messages/en/narrative.json";
import enVocabulary from "@/messages/en/vocabulary.json";
import enViews from "@/messages/en/views.json";
import enWorkforce from "@/messages/en/workforce.json";

import idAsk from "@/messages/id/ask.json";
import idAskResponses from "@/messages/id/ask-responses.json";
import idContent from "@/messages/id/content.json";
import idEnterprise from "@/messages/id/enterprise.json";
import idNarrative from "@/messages/id/narrative.json";
import idVocabulary from "@/messages/id/vocabulary.json";
import idViews from "@/messages/id/views.json";
import idWorkforce from "@/messages/id/workforce.json";

const CATALOG: Record<EnterpriseLocale, EnterpriseMessages> = {
  en: {
    enterprise: enEnterprise,
    workforce: enWorkforce,
    vocabulary: enVocabulary as EnterpriseMessages["vocabulary"],
    ask: enAsk,
    content: enContent,
    askResponses: enAskResponses,
    views: enViews,
    narrative: enNarrative,
  },
  id: {
    enterprise: idEnterprise,
    workforce: idWorkforce,
    vocabulary: idVocabulary as EnterpriseMessages["vocabulary"],
    ask: idAsk,
    content: idContent,
    askResponses: idAskResponses,
    views: idViews,
    narrative: idNarrative,
  },
};

export function getEnterpriseMessages(locale: EnterpriseLocale): EnterpriseMessages {
  return CATALOG[locale];
}

export const DEFAULT_ENTERPRISE_LOCALE: EnterpriseLocale = "en";

export const ENTERPRISE_LOCALE_STORAGE_KEY = "ida-enterprise-locale";