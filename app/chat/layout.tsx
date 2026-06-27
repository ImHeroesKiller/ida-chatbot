import { Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";
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
    <div className={geistMono.variable}>
      <AuthProvider>
        <AppChrome>{children}</AppChrome>
      </AuthProvider>
    </div>
  );
}