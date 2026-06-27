export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-dvh overflow-y-auto">{children}</div>;
}