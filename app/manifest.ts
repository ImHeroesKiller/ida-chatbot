import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";
import { LANDING_COPY } from "@/lib/landing/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IDA — Asisten AI Indonesia",
    short_name: BRAND.shortName,
    description: `${LANDING_COPY.subheadline} Worksheet, Web Search, Research, dan Map dalam satu chat.`,
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    orientation: "portrait-primary",
    lang: "id",
    dir: "ltr",
    categories: ["productivity", "business", "utilities"],
    icons: [
      {
        src: "/ida-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/ida-icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/ida-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/ida-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/ida-logo.png",
        sizes: "528x530",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/pwa-screenshot-narrow.png",
        sizes: "540x720",
        type: "image/png",
        form_factor: "narrow",
        label: "Tampilan chat IDA di ponsel",
      },
      {
        src: "/pwa-screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Tampilan IDA di desktop",
      },
    ],
    shortcuts: [
      {
        name: "Mulai Chat Gratis",
        short_name: "Chat",
        description: "Buka percakapan IDA",
        url: "/chat",
        icons: [{ src: "/ida-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Akun",
        short_name: "Akun",
        description: "Kelola profil pengguna",
        url: "/account",
        icons: [{ src: "/ida-icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    prefer_related_applications: false,
  };
}