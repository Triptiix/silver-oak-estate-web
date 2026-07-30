import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { formatInrFromPaise, publicInformation } from "@/config/public-information";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Booking Information",
  description: "Review verified capacity, payment and operational information for Silver Oak Estate. Final legal booking terms will be provided before payment and confirmation.",
  path: "/policies",
});

export default function PoliciesPage() {
  const { booking, capacity, parking, optionalArrangements, contact, tax } = publicInformation;
  const weekdayRate = formatInrFromPaise(booking.weekday.ratePaise);
  const weekendRate = formatInrFromPaise(booking.weekend.ratePaise);
  const advanceAmount = formatInrFromPaise(booking.advancePaise);

  return (
    <div className="min-h-screen bg-[var(--soe-surface-bg-primary)] text-[var(--soe-surface-text-primary)]">
      {/* HERO SECTION */}
      <EstateSection surface="dark" spacing="lg">
        <EstateContainer variant="content">
          <div className="max-w-3xl space-y-6">
            <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
              OPERATIONAL GUIDELINES · SECTOR 135, NOIDA
            </EstateEyebrow>
            <EstateHeading as="h1" variant="hero">
              Booking Information & Current Policies
            </EstateHeading>
            <EstateText variant="lg" tone="muted">
              Verified operational parameters, guest capacity information and current payment information for Silver Oak Estate.
            </EstateText>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* OPERATIONAL SUMMARY & LEGAL REVIEW NOTICE */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="max-w-4xl space-y-12">
            {/* Legal Status Notice */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-color-brand)]/30 rounded-[var(--soe-radius-card)] p-8 space-y-4">
              <span className="inline-block px-3 py-1 font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-wider bg-[var(--soe-color-brand)]/10 text-[var(--soe-color-brand)] rounded-[var(--soe-radius-pill)]">
                Legal review in progress
              </span>
              <EstateHeading as="h2" variant="h2">
                Operational Summary Notice
              </EstateHeading>
              <EstateText tone="muted">
                This page outlines our current operational guidelines and verified property parameters. It is an operational summary and does not constitute a final booking contract. Final booking, cancellation, refund, payment, house-rule, liability and privacy terms will be provided for review and acceptance before payment and booking confirmation.
              </EstateText>
            </div>

            {/* Standard Booking Slot Summary */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-4">
              <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                STANDARD BOOKING SLOT
              </p>
              <EstateHeading as="h2" variant="h2">
                Slot Timings & Occupancy Period
              </EstateHeading>
              <ul className="space-y-3 font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Check-in Time:</strong> {booking.checkIn.timeLabel}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Checkout Time:</strong> {booking.checkOut.timeLabel}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Slot Duration:</strong> {booking.durationLabel} ({booking.durationHours} hours total occupancy period).</span>
                </li>
              </ul>
            </div>

            {/* Verified Capacities & Property Use */}
            <div className="space-y-6">
              <EstateHeading as="h2" variant="h2">
                Property Use & Capacity Guidelines
              </EstateHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-6 space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    OVERNIGHT STAYS
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {capacity.overnightLabel}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    Full access to the 3 BHK residence across 3 king-bed bedrooms.
                  </EstateText>
                </div>

                <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-6 space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    INDOOR GATHERINGS
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {capacity.indoorLabel}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    Seating capacity across the main hall and dedicated dining area.
                  </EstateText>
                </div>

                <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-6 space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    DAYTIME EVENTS
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {capacity.standardDayEventLabel}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    Capacity information for standard daytime gatherings at the property.
                  </EstateText>
                </div>
              </div>
              <EstateText variant="sm" tone="muted">
                {capacity.largerEventStatement}
              </EstateText>
              <EstateText variant="sm" tone="muted">
                {parking.summary}
              </EstateText>
            </div>

            {/* Payment Summary */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-6">
              <EstateHeading as="h2" variant="h2">
                Payment Schedule & Written Confirmation
              </EstateHeading>
              <ul className="space-y-3 font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>{booking.weekday.label} Booking Rate:</strong> {weekdayRate} for the {booking.durationLabel}.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>{booking.weekend.label} Booking Rate:</strong> {weekendRate} for the {booking.durationLabel}.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Booking Advance:</strong> {advanceAmount} flat advance required upon reservation.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Balance Payment:</strong> {booking.balanceText}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Taxes & GST:</strong> {tax.currentStatement}</span>
                </li>
              </ul>
              <div className="pt-4 border-t border-[var(--soe-surface-control-border)]/20">
                <p className="font-soe-ui text-[length:var(--soe-text-sm)] font-medium text-[var(--soe-surface-text-primary)] leading-relaxed">
                  {booking.confirmationNotice}
                </p>
              </div>
            </div>

            {/* Optional Arrangements */}
            <div className="space-y-4">
              <EstateHeading as="h2" variant="h2">
                Optional Service Arrangements
              </EstateHeading>
              <EstateText tone="muted">
                {optionalArrangements.statement}
              </EstateText>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <EstateActionLink href="/pricing" variant="button">
                View Pricing
              </EstateActionLink>
              <EstateActionLink href={contact.mailtoHref} variant="editorial">
                Email an Enquiry
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
