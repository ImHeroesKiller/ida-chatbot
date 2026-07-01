import Image from "next/image";

const LCP_LOGO = "/ida-logo-small.webp";

export function LandingLcpLogo() {
  return (
    <Image
      src={LCP_LOGO}
      alt="Logo IDA — Intelligent Digital Assistant"
      width={64}
      height={64}
      sizes="64px"
      priority
      fetchPriority="high"
      className="size-16 rounded-2xl object-contain"
    />
  );
}

export const LCP_LOGO_PATH = LCP_LOGO;