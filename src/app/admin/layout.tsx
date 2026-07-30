import type { Metadata } from "next";

// robots.txt already disallows /admin/, but a disallowed URL can still be
// indexed if it is linked externally. This adds an explicit per-page signal
// for every administrator route.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

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
