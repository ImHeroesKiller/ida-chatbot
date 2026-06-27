import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/ida-logo.png"),
  );
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    <img src={logoBase64} alt="" width={180} height={180} />,
    { ...size },
  );
}