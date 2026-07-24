import Link from "next/link";
import { bookingReferencePattern } from "@/lib/admin/query";

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
  for (const [key, value] of Object.entries(query)) {
    const selected = Array.isArray(value) ? value[0] : value;
    if (!selected || key === "page" || !preservedKeys.has(key)) continue;
    if (key === "bookingReference" && !bookingReferencePattern.test(selected)) continue;
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
}: {
  page: number;
  totalPages: number;
  path: string;
  query?: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (targetPage: number) => buildAdminPaginationHref(path, query, targetPage);
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      <Link aria-disabled={page <= 1} className="rounded border px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40" href={href(Math.max(1, page - 1))}>Previous</Link>
      <span>Page {page} of {totalPages}</span>
      <Link aria-disabled={page >= totalPages} className="rounded border px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40" href={href(Math.min(totalPages, page + 1))}>Next</Link>
    </nav>
  );
}
