import {
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
} from "@/lib/seo/json-ld";

export function StructuredData() {
  const organization = buildOrganizationJsonLd();
  const webApplication = buildWebApplicationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
    </>
  );
}