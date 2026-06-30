import { Geist_Mono } from "next/font/google";

import { AppChrome } from "@/components/app/app-chrome";

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
      className={`${geistMono.variable} chat-container max-w-full overflow-x-hidden`}
    >
      <AppChrome>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </AppChrome>
    </div>
  );
}