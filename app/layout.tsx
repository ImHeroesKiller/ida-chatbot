import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { contrastForeground, normalizeHexColor } from "@/lib/ui-config/color";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/components/auth/auth-provider";
import { GlobalUiProvider } from "@/components/global-ui-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND, getMetadataBase } from "@/lib/brand";
import { buildUiInitScript } from "@/lib/ui-config/init-script";
import { loadUiConfig } from "@/lib/ui-config/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: BRAND.fullName,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.shortName,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/ida-logo.png", sizes: "528x530", type: "image/png" }],
    apple: [{ url: "/ida-logo.png", sizes: "528x530", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: BRAND.name,
    title: BRAND.fullName,
    description: BRAND.description,
    images: [
      {
        url: BRAND.logoSrc,
        width: 528,
        height: 530,
        alt: BRAND.name,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: BRAND.fullName,
    description: BRAND.description,
    images: [BRAND.logoSrc],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.shortName,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.backgroundColor },
    { media: "(prefers-color-scheme: dark)", color: BRAND.themeColor },
  ],
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
        <script dangerouslySetInnerHTML={{ __html: uiInitScript }} />
      </head>
      <body className="h-dvh overflow-hidden bg-background font-sans text-foreground">
        <AuthProvider>
          <GlobalUiProvider initialConfig={uiConfig}>
            <ThemeProvider>
              {children}
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