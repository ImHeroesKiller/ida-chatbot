import {
  buildLandingPageJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/json-ld";

export function LandingStructuredData() {
  const schemas = [
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    buildWebApplicationJsonLd(),
    buildSoftwareApplicationJsonLd(),
    buildLandingPageJsonLd(),
  ];

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