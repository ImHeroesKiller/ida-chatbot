import { getLocale } from "next-intl/server";

import {
  buildLandingPageJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/json-ld";

export async function LandingStructuredData() {
  const locale = await getLocale();
  const schemas = await Promise.all([
    buildOrganizationJsonLd(locale),
    buildWebSiteJsonLd(locale),
    buildWebApplicationJsonLd(locale),
    buildSoftwareApplicationJsonLd(locale),
    buildLandingPageJsonLd(locale),
  ]);

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"] as string}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}