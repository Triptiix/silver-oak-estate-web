export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--surface)]">
      <main className="flex-1">{children}</main>
    </div>
  );
}
