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
      <SiteHeader />
      <main className="flex-1 pb-24 sm:pb-0">{children}</main>
      <SiteFooter />
      <MobileBookingCTA />
    </div>
  );
}
