import { getPreconnectOrigins } from "@/lib/performance/preconnect";

export function PreconnectLinks() {
  const origins = getPreconnectOrigins();

  return (
    <>
      {origins.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}
      {origins.map((origin) => (
        <link key={`${origin}-dns`} rel="dns-prefetch" href={origin} />
      ))}
    </>
  );
}