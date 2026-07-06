import { MetadataRoute } from 'next';
import { getMessages } from 'next-intl/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const idMessages = await getMessages({ locale: 'id' });

  return {
    name: "IDA — Asisten AI Indonesia",
    short_name: "IDA",
    description: idMessages.Seo?.description || "Enterprise Decision & Digital Workforce Operating System",
    start_url: "/",
    scope: "/",
    id: "/",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png"
      }
    ],
    theme_color: "#2563EB",
    background_color: "#F8FAFC",
    display: "standalone"
  };
}
