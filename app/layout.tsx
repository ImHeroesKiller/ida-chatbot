import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { contrastForeground, normalizeHexColor } from "@/lib/ui-config/color";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AuthProvider } from "@/components/auth/auth-provider";
import { DeferredPwa } from "@/components/performance/deferred-pwa";
import { PreconnectLinks } from "@/components/performance/preconnect-links";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
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
import { buildUiInitScript } from "@/lib/ui-config/init-script";
import { loadUiConfig } from "@/lib/ui-config/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  manifest: "/manifest.json",
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
      [SEO_LOCALES.en.hreflang]: `${getCanonicalUrl("/")}?lang=en`,
      "x-default": getCanonicalUrl("/"),
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/ida-logo.png", sizes: "528x530", type: "image/png" },
    ],
    apple: [{ url: "/ida-logo.png", sizes: "528x530", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: SEO_LOCALES.id.tag,
    alternateLocale: [SEO_LOCALES.en.tag],
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
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.backgroundColor },
    { media: "(prefers-color-scheme: dark)", color: BRAND.themeColor },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uiConfig = await loadUiConfig();
  const uiInitScript = buildUiInitScript(uiConfig);
  const primaryColor =
    normalizeHexColor(uiConfig.primaryColor) ?? uiConfig.primaryColor;

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
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
      <body className="h-dvh overflow-hidden bg-background font-sans text-foreground">
        <AuthProvider>
          <GlobalUiProvider initialConfig={uiConfig}>
            <ThemeProvider>
              {children}
              <DeferredPwa />
              <WebVitalsReporter />
              <Analytics />
              <SpeedInsights />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  className:
                    "!bg-card !text-card-foreground !border !border-border !shadow-lg",
                }}
              />
            </ThemeProvider>
          </GlobalUiProvider>
        </AuthProvider>
      </body>
    </html>
  );
}