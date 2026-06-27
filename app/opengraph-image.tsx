import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";

export const alt = BRAND.fullName;
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
          background: "#171717",
          padding: 64,
        }}
      >
        <img src={logoBase64} alt="" width={280} height={280} />
        <p
          style={{
            marginTop: 40,
            fontSize: 56,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          {BRAND.name}
        </p>
        <p
          style={{
            marginTop: 16,
            fontSize: 28,
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Intelligent Digital Assistant
        </p>
      </div>
    ),
    { ...size },
  );
}