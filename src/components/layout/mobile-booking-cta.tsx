"use client";

import { usePathname } from "next/navigation";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";

type MobileBookingCTAProps = {
  onlineBookingAvailable?: boolean;
};

export function MobileBookingCTA({
  onlineBookingAvailable = false,
}: MobileBookingCTAProps) {
  const pathname = usePathname();
  const bookingAction = onlineBookingAvailable
    ? { href: "/book", label: "Check Availability & Book" }
    : { href: "/availability", label: "Check Availability" };

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
        className="md:hidden"
        style={{
          height: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      />
      <aside
        aria-label="Booking action"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--soe-surface-control-border)] bg-[var(--soe-surface-bg-primary)] p-4 md:hidden"
        style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <EstateActionLink
          href={bookingAction.href}
          variant="button"
          className="w-full justify-center"
        >
          {bookingAction.label}
        </EstateActionLink>
      </aside>
    </>
  );
}
