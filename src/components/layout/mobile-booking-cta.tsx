"use client";

import { usePathname } from "next/navigation";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { publicInformation } from "@/config/public-information";

type MobileBookingCTAProps = {
  onlineBookingAvailable?: boolean;
};

export function MobileBookingCTA({
  onlineBookingAvailable = false,
}: MobileBookingCTAProps) {
  const pathname = usePathname();
  const { contact } = publicInformation;

  const bookingAction = onlineBookingAvailable
    ? { href: "/book", label: "Check Availability & Book" }
    : { href: "/availability", label: "Check Availability" };

  if (
    pathname === "/book" ||
    pathname?.startsWith("/book/") ||
    pathname === "/availability" ||
    pathname?.startsWith("/availability/") ||
    pathname === "/contact" ||
    pathname?.startsWith("/contact/")
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
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--soe-surface-control-border)] bg-[var(--soe-surface-bg-primary)]/95 backdrop-blur-md p-3 md:hidden"
        style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center gap-2">
          <EstateActionLink
            href={bookingAction.href}
            variant="button"
            className="flex-1 justify-center min-h-[48px]"
          >
            {bookingAction.label}
          </EstateActionLink>
          <a
            href={contact.primaryPhone.telHref}
            aria-label={`Call Silver Oak Estate at ${contact.primaryPhone.display}`}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--soe-radius-control)] border border-[var(--soe-color-gold)]/60 bg-transparent text-[var(--soe-surface-text-primary)] hover:bg-white/10 active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
          <a
            href={contact.primaryPhone.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Silver Oak Estate on WhatsApp"
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--soe-radius-control)] border border-[var(--soe-color-gold)]/60 bg-transparent text-[var(--soe-surface-text-primary)] hover:bg-white/10 active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)]"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
          </a>
        </div>
      </aside>
    </>
  );
}
