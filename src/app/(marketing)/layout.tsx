import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBookingCTA } from "@/components/layout/mobile-booking-cta";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-[var(--soe-radius-control)] focus:bg-[var(--soe-surface-bg-primary)] focus:text-[var(--soe-surface-text-primary)] focus:shadow-[var(--soe-shadow-overlay)] focus:outline focus:outline-2 focus:outline-[var(--soe-color-focus-ring)]"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 sm:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileBookingCTA />
    </div>
  );
}
