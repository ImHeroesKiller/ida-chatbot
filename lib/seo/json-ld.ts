import { BRAND } from "@/lib/brand";

import { getCanonicalUrl, getOgImageUrl, getSiteUrl } from "./config";

export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: BRAND.fullName,
    url: siteUrl,
    logo: new URL(BRAND.logoSrc, siteUrl).toString(),
    description: BRAND.description,
    sameAs: [],
  };
}

export function buildWebApplicationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND.name,
    alternateName: BRAND.fullName,
    url: getCanonicalUrl("/chat"),
    image: getOgImageUrl(),
    description: BRAND.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
    },
    inLanguage: ["id", "en", "zh"],
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
    },
  };
}