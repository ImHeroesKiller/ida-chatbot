import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [36, 40, 64, 96, 128, 256, 384, 528],
    imageSizes: [16, 28, 32, 36, 40, 48, 64, 96, 128],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "react-markdown",
      "react-hot-toast",
    ],
  },
  headers: async () => [
    {
      source: "/",
      headers: [
        {
          key: "Cache-Control",
          value:
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      ],
    },
    {
      source: "/ida-logo-small.webp",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
    {
      source: "/manifest.json",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
    {
      source: "/manifest.webmanifest",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
  ],
};

export default nextConfig;