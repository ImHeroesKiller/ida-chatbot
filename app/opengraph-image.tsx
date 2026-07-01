import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";
import { LANDING_SEO_DESCRIPTION } from "@/lib/seo/landing-metadata";

export const alt = `${BRAND.name} — Asisten AI Indonesia`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/ida-logo.png"),
  );
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #171717 0%, #262626 55%, #171717 100%)",
          padding: 56,
        }}
      >
        <img src={logoBase64} alt="" width={200} height={200} />
        <p
          style={{
            marginTop: 32,
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          {BRAND.name} — Asisten AI Indonesia
        </p>
        <p
          style={{
            marginTop: 20,
            fontSize: 26,
            color: "rgba(255,255,255,0.82)",
            textAlign: "center",
            maxWidth: 920,
            lineHeight: 1.35,
          }}
        >
          Chat · Worksheet · Web Search · Research · Map
        </p>
        <p
          style={{
            marginTop: 16,
            fontSize: 20,
            color: "rgba(255,255,255,0.62)",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          {LANDING_SEO_DESCRIPTION.slice(0, 120)}…
        </p>
      </div>
    ),
    { ...size },
  );
}