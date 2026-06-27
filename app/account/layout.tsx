import { AuthProvider } from "@/components/auth/auth-provider";
import { AppChrome } from "@/components/app/app-chrome";

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <AppChrome>{children}</AppChrome>
    </AuthProvider>
  );
}