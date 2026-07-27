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
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--soe-surface-control-border)] bg-[var(--soe-surface-bg-primary)] p-4 sm:hidden"
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
    </div>
  );
}
