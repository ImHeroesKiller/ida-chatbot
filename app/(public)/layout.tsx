export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-dvh min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain">
      {children}
    </div>
  );
}