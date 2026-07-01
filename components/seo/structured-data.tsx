import {
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
} from "@/lib/seo/json-ld";

export async function StructuredData() {
  const locale = "id";
  const [organization, webApplication] = await Promise.all([
    buildOrganizationJsonLd(locale),
    buildWebApplicationJsonLd(locale),
  ]);

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