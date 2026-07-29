"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/operations", "Operations"],
  ["/admin/bookings", "Bookings"],
  ["/admin/payments", "Payments"],
  ["/admin/recovery", "Recovery · diagnosis only"],
  ["/admin/notifications", "Notifications"],
] as const;

function isActiveDestination(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administrator workspace">
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
          {links.map(([href, label]) => {
            const active = isActiveDestination(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-[var(--radius)] border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
