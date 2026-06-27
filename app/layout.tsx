import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { contrastForeground, normalizeHexColor } from "@/lib/ui-config/color";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/components/auth/auth-provider";
import { GlobalUiProvider } from "@/components/global-ui-provider";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "IDA — Intelligent Digital Assistant",
  description:
    "IDA — Intelligent Digital Assistant. Standalone AI chatbot with RAG, memory, and multilingual support.",
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