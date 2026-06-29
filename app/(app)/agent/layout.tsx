import { Geist_Mono } from "next/font/google";

import { AppChrome } from "@/components/app/app-chrome";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistMono.variable} h-dvh overflow-hidden`}>
      <AppChrome>{children}</AppChrome>
    </div>
  );
}