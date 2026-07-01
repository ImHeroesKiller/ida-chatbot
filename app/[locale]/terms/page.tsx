import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalSectionContent } from "@/components/legal/legal-section-content";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import type { LegalSectionContent as LegalSectionData } from "@/lib/legal/types";
import { IDA_CONFIG } from "@/lib/config";
import { buildLanguageAlternates, getLocalizedCanonicalUrl } from "@/lib/seo/locale-path";
import { SEO_LOCALES } from "@/lib/seo/config";
import type { Locale } from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  const localeTag = SEO_LOCALES[locale as Locale]?.tag ?? SEO_LOCALES.id.tag;

  return {
    title: `${t("title")} — ${IDA_CONFIG.name}`,
    description: t("intro"),
    alternates: {
      canonical: getLocalizedCanonicalUrl("/terms", locale),
      languages: buildLanguageAlternates("/terms"),
    },
    openGraph: {
      title: `${t("title")} — ${IDA_CONFIG.name}`,
      description: t("intro"),
      locale: localeTag,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage() {
  const t = await getTranslations("Terms");
  const sections = t.raw("sections") as Record<string, LegalSectionData>;

  return (
    <LegalPage title={t("title")} lastUpdated={t("lastUpdated")}>
      <p>{t("intro")}</p>

      {Object.values(sections).map((section) => (
        <LegalSection key={section.title} title={section.title}>
          <LegalSectionContent blocks={section.blocks} />
        </LegalSection>
      ))}
    </LegalPage>
  );
}