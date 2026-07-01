import { LandingPageStatic } from "@/components/landing/landing-page-static";
import { LandingStructuredData } from "@/components/seo/landing-structured-data";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <LandingStructuredData />
      <LandingPageStatic />
    </>
  );
}