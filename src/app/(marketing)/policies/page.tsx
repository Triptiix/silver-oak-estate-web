import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { formatInrFromPaise, publicInformation } from "@/config/public-information";
import { legalInformation } from "@/config/legal-information";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Booking Information",
  description: "Summary of booking terms, capacity, payment, cancellation and operational information for Silver Oak Estate in Sector 135, Noida.",
  path: "/policies",
});

export default function PoliciesPage() {
  const { booking, capacity, parking, optionalArrangements, contact, tax } = publicInformation;
  const weekdayRate = formatInrFromPaise(booking.weekday.ratePaise);
  const weekendRate = formatInrFromPaise(booking.weekend.ratePaise);
  const advanceAmount = formatInrFromPaise(legalInformation.bookingAdvancePaise);
  const depositAmount = formatInrFromPaise(legalInformation.securityDepositPaise);

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
            {/* Final Terms Status */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-color-brand)]/30 rounded-[var(--soe-radius-card)] p-8 space-y-4">
              <span className="inline-block px-3 py-1 font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-wider bg-[var(--soe-color-brand)]/10 text-[var(--soe-color-brand)] rounded-[var(--soe-radius-pill)]">
                Terms effective {legalInformation.effectiveDateLabel}
              </span>
              <EstateHeading as="h2" variant="h2">
                Operational Summary
              </EstateHeading>
              <EstateText tone="muted">
                This page is a plain-language summary of our operational parameters and booking terms. The complete and binding terms are set out in our Terms and Conditions, and personal information is handled as described in our Privacy Policy. Where this summary and the full Terms and Conditions differ, the Terms and Conditions apply.
              </EstateText>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <EstateActionLink href="/terms" variant="button">
                  Read Terms &amp; Conditions
                </EstateActionLink>
                <EstateActionLink href="/privacy" variant="editorial">
                  Read Privacy Policy
                </EstateActionLink>
              </div>
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

            {/* Booking Terms Summary */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-6">
              <EstateHeading as="h2" variant="h2">
                Booking Terms Summary
              </EstateHeading>
              <ul className="space-y-3 font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Booking Advance:</strong> {advanceAmount}, adjusted against the total booking price.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Refundable Security Deposit:</strong> a separate {depositAmount}, which is not part of the booking price and not part of the booking advance. Ordinarily refunded within {legalInformation.depositReturnWindowLabel} after checkout and inspection, less any documented deduction.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Minimum Booking Age:</strong> the person making the booking must be at least {legalInformation.minimumBookingAge} years old.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Written Confirmation:</strong> a booking is confirmed only after approved availability, written pricing, required payment and a written booking confirmation. An enquiry does not reserve the property, and payment alone does not automatically confirm a booking.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Rescheduling:</strong> {legalInformation.reschedule.complimentaryCount} complimentary reschedule when requested at least {legalInformation.reschedule.minimumNoticeDays} days before check-in, subject to availability and written confirmation.</span>
                </li>
              </ul>

              <div className="pt-2 space-y-3">
                <EstateHeading as="h3" variant="h3">
                  Cancellation Summary
                </EstateHeading>
                <ul className="space-y-3 font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-secondary)]">
                  {legalInformation.cancellation.bands.map((band) => (
                    <li key={band.window} className="flex items-start gap-3">
                      <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                      <span><strong>{band.window}:</strong> {band.refund}.</span>
                    </li>
                  ))}
                </ul>
                <EstateText variant="sm" tone="muted">
                  Approved refunds are initiated within {legalInformation.cancellation.refundInitiationBusinessDays} business days after approval; bank or payment-provider processing time applies after initiation. Where the refundable security deposit has been paid and the property has not been accessed with no damage or recoverable expense, that deposit is returned in full.
                </EstateText>
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
