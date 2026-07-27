"use client";

import { usePathname } from "next/navigation";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";

export function MobileBookingCTA() {
  const pathname = usePathname();

  if (
    pathname === "/book" ||
    pathname?.startsWith("/book/") ||
    pathname === "/availability" ||
    pathname?.startsWith("/availability/")
  ) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        data-testid="mobile-booking-spacer"
        className="h-24 md:hidden"
      />
      <aside
        aria-label="Booking action"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--soe-surface-control-border)] bg-[var(--soe-surface-bg-primary)] p-4 md:hidden"
        style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <EstateActionLink
          href="/book"
          variant="button"
          className="w-full justify-center"
        >
          Check Availability & Book
        </EstateActionLink>
      </aside>
    </>
  );
}
