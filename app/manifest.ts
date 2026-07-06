import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IDA — Asisten AI Indonesia",
    short_name: "IDA",
    description:
      "IDA is an Enterprise Decision & Digital Workforce Operating System.",
    start_url: "/",
    scope: "/",
    id: "/",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    theme_color: "#2563EB",
    background_color: "#F8FAFC",
    display: "standalone",
  };
}