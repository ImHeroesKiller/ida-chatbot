import { IDA_CONFIG } from "@/lib/config";

export const BRAND = {
  name: IDA_CONFIG.name,
  fullName: "IDA — Intelligent Digital Assistant",
  shortName: "IDA",
  description:
    "IDA — Asisten AI Indonesia untuk chat, Worksheet, Web Search, Research, dan Map. Gratis dicoba.",
  logoSrc: "/ida-logo.png",
  themeColor: "#171717",
  backgroundColor: "#ffffff",
} as const;

export function getMetadataBase(): URL {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (url) {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    return new URL(normalized);
  }

  return new URL("http://localhost:3000");
}