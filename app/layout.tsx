import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { contrastForeground, normalizeHexColor } from "@/lib/ui-config/color";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import { PreconnectLinks } from "@/components/performance/preconnect-links";
import { StructuredData } from "@/components/seo/structured-data";
import { GlobalUiProvider } from "@/components/global-ui-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND, getMetadataBase } from "@/lib/brand";
import {
  getCanonicalUrl,
  getOgImageUrl,
  SEO_KEYWORDS,
  SEO_LOCALES,
} from "@/lib/seo/config";
import { DEFAULT_UI_CONFIG } from "@/lib/ui-config/defaults";
import { buildUiInitScript } from "@/lib/ui-config/init-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: BRAND.fullName,
    template: `%s · ${BRAND.name}`,
  },
  description: SEO_LOCALES.id.description,
  keywords: [...SEO_KEYWORDS],
  applicationName: BRAND.shortName,
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: "technology",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: getCanonicalUrl("/"),
    languages: {
      [SEO_LOCALES.id.hreflang]: getCanonicalUrl("/"),
      [SEO_LOCALES.en.hreflang]: getCanonicalUrl("/en"),
      [SEO_LOCALES.zh.hreflang]: getCanonicalUrl("/zh"),
      "x-default": getCanonicalUrl("/"),
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: SEO_LOCALES.id.tag,
    alternateLocale: [SEO_LOCALES.en.tag, SEO_LOCALES.zh.tag],
    url: getCanonicalUrl("/"),
    siteName: BRAND.name,
    title: BRAND.fullName,
    description: SEO_LOCALES.id.description,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: BRAND.fullName,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.fullName,
    description: SEO_LOCALES.en.description,
    images: [getOgImageUrl()],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.shortName,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  // Removed "interactiveWidget" as it caused console error "Viewport argument key "interactive-widget" not recognized and ignored."
  // (It was intended for mobile keyboard handling but isn't widely supported and pollutes console.)
  // For chat keyboard handling, we rely on CSS (dvh, etc.) and JS in chat-app-height-sync.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.backgroundColor },
    { media: "(prefers-color-scheme: dark)", color: BRAND.themeColor },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uiConfig = DEFAULT_UI_CONFIG;
  const uiInitScript = buildUiInitScript(uiConfig);
  const primaryColor =
    normalizeHexColor(uiConfig.primaryColor) ?? uiConfig.primaryColor;

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
      data-ida-font-size={uiConfig.fontSize}
      data-ida-density={uiConfig.density}
      data-ida-animation={uiConfig.animationLevel}
      style={
        {
          "--ida-message-max-width": uiConfig.messageMaxWidth,
          "--primary": primaryColor,
          "--primary-foreground": contrastForeground(primaryColor),
        } as CSSProperties
      }
    >
      <head>
        <PreconnectLinks />
        <StructuredData />
        <script dangerouslySetInnerHTML={{ __html: uiInitScript }} />
      </head>
      <body className="h-full overflow-hidden bg-background font-sans text-foreground">
        <GlobalUiProvider initialConfig={uiConfig}>
          <ThemeProvider>
            {children}
            <WebVitalsReporter />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </GlobalUiProvider>
      </body>
    </html>
  );
}