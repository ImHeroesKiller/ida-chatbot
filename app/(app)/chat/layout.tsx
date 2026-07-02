import { Geist_Mono } from "next/font/google";
import Script from "next/script";

import { AppChrome } from "@/components/app/app-chrome";
import { ChatAppHeightSync } from "@/components/chat/chat-app-height-sync";
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geistMono.variable} flex h-[var(--app-height)] flex-col overflow-hidden bg-background`}
    >
      <Script id="chat-app-height" strategy="beforeInteractive">
        {`(function(){var h=window.visualViewport?window.visualViewport.height:window.innerHeight;document.documentElement.style.setProperty('--app-height',h+'px');})();`}
      </Script>
      <ChatAppHeightSync />
      <AppChrome>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </AppChrome>
    </div>
  );
}