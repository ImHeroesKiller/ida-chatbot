import { getTranslations } from "next-intl/server";

import { BRAND } from "@/lib/brand";
import type { Locale } from "@/lib/config";

import { getCanonicalUrl, getOgImageUrl, getSiteUrl, SEO_LOCALES } from "./config";
import { getLocalizedCanonicalUrl } from "./locale-path";

async function getSeoCopy(locale: string) {
  const t = await getTranslations({ locale, namespace: "Seo" });
  const landing = await getTranslations({ locale, namespace: "Landing" });

  return {
    description: t("description"),
    keywords: (t.raw("keywords") as string[]).join(", "),
    pageName: landing("hero.title"),
    localeTag: SEO_LOCALES[locale as Locale]?.tag ?? SEO_LOCALES.id.tag,
  };
}

export async function buildOrganizationJsonLd(locale: string) {
  const siteUrl = getSiteUrl();
  const seo = await getSeoCopy(locale);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: BRAND.fullName,
    url: siteUrl,
    logo: new URL(BRAND.logoSrc, siteUrl).toString(),
    description: seo.description,
    areaServed: {
      "@type": "Country",
      name: "Indonesia",
    },
    knowsLanguage: ["id", "en", "zh"],
    sameAs: [],
  };
}

export async function buildWebSiteJsonLd(locale: string) {
  const siteUrl = getSiteUrl();
  const seo = await getSeoCopy(locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    alternateName: BRAND.fullName,
    url: siteUrl,
    description: seo.description,
    inLanguage: seo.localeTag,
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
    },
  };
}

export async function buildWebApplicationJsonLd(locale: string) {
  const siteUrl = getSiteUrl();
  const seo = await getSeoCopy(locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND.name,
    alternateName: BRAND.fullName,
    url: getLocalizedCanonicalUrl("/", locale),
    installUrl: getCanonicalUrl("/chat"),
    image: getOgImageUrl(),
    description: seo.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Chat AI",
      "Worksheet",
      "Web Search",
      "Research",
      "Map",
      "Multilingual Indonesian English Chinese",
    ],
    keywords: seo.keywords,
    inLanguage: ["id", "en", "zh"],
    countriesSupported: "ID",
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
    },
  };
}

export async function buildSoftwareApplicationJsonLd(locale: string) {
  const siteUrl = getSiteUrl();
  const seo = await getSeoCopy(locale);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: getLocalizedCanonicalUrl("/", locale),
    description: seo.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
    },
    author: {
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
    },
  };
}

export async function buildLandingPageJsonLd(locale: string) {
  const seo = await getSeoCopy(locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.pageName,
    description: seo.description,
    url: getLocalizedCanonicalUrl("/", locale),
    inLanguage: seo.localeTag,
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.name,
      url: getSiteUrl(),
    },
    about: {
      "@type": "SoftwareApplication",
      name: BRAND.name,
      applicationCategory: "ProductivityApplication",
    },
  };
}