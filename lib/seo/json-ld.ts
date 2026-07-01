import { BRAND } from "@/lib/brand";
import { LANDING_COPY } from "@/lib/landing/content";

import { getCanonicalUrl, getOgImageUrl, getSiteUrl } from "./config";
import {
  LANDING_SEO_DESCRIPTION,
  LANDING_SEO_KEYWORDS,
} from "./landing-metadata";

export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: BRAND.fullName,
    url: siteUrl,
    logo: new URL(BRAND.logoSrc, siteUrl).toString(),
    description: LANDING_SEO_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "Indonesia",
    },
    knowsLanguage: ["id", "en", "zh"],
    sameAs: [],
  };
}

export function buildWebSiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    alternateName: BRAND.fullName,
    url: siteUrl,
    description: LANDING_SEO_DESCRIPTION,
    inLanguage: "id-ID",
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
    },
  };
}

export function buildWebApplicationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND.name,
    alternateName: BRAND.fullName,
    url: getCanonicalUrl("/"),
    installUrl: getCanonicalUrl("/chat"),
    image: getOgImageUrl(),
    description: LANDING_SEO_DESCRIPTION,
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
      "Multibahasa Indonesia English 中文",
    ],
    keywords: LANDING_SEO_KEYWORDS.join(", "),
    inLanguage: ["id", "en", "zh"],
    countriesSupported: "ID",
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
    },
  };
}

export function buildSoftwareApplicationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: getCanonicalUrl("/"),
    description: LANDING_SEO_DESCRIPTION,
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

export function buildLandingPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: LANDING_COPY.headline,
    description: LANDING_SEO_DESCRIPTION,
    url: getCanonicalUrl("/"),
    inLanguage: "id-ID",
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