import Link from "next/link";
import {
  isCanonicalBookingReference,
  parseAdminListQuery,
} from "@/lib/admin/query";

const preservedKeys = new Set([
  "bookingReference", "bookingStatus", "paymentStatus", "recoveryState",
  "notificationStatus", "checkInFrom", "checkInTo", "sort", "pageSize",
]);

export function buildAdminPaginationHref(
  path: string,
  query: Record<string, string | string[] | undefined>,
  targetPage: number,
) {
  const params = new URLSearchParams();
  const normalized = parseAdminListQuery(query);
  for (const [key, value] of Object.entries(query)) {
    const selected = Array.isArray(value) ? value[0] : value;
    if (!selected || key === "page" || !preservedKeys.has(key)) continue;
    if (key === "bookingReference" && !isCanonicalBookingReference(selected)) continue;
    const normalizedValue = normalized[key as keyof typeof normalized];
    if (String(normalizedValue ?? "") !== selected) continue;
    params.set(key, selected);
  }
  params.set("page", String(targetPage));
  return `${path}?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  path,
  query = {},
  label = "Pagination",
}: {
  page: number;
  totalPages: number;
  path: string;
  query?: Record<string, string | string[] | undefined>;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const href = (targetPage: number) => buildAdminPaginationHref(path, query, targetPage);
  return (
    <nav
      aria-label={label}
      className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm"
    >
      {page <= 1 ? (
        <span className="inline-flex min-h-11 items-center justify-center justify-self-start rounded border px-3 text-[var(--muted-foreground)] opacity-60">
          Previous
        </span>
      ) : (
        <Link
          className="inline-flex min-h-11 items-center justify-center justify-self-start rounded border px-3 font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          href={href(page - 1)}
        >
          Previous
        </Link>
      )}
      <span aria-live="polite" className="text-center">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      {page >= totalPages ? (
        <span className="inline-flex min-h-11 items-center justify-center justify-self-end rounded border px-3 text-[var(--muted-foreground)] opacity-60">
          Next
        </span>
      ) : (
        <Link
          className="inline-flex min-h-11 items-center justify-center justify-self-end rounded border px-3 font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          href={href(page + 1)}
        >
          Next
        </Link>
      )}
    </nav>
  );
}
