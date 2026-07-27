import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { formatInrFromPaise, publicInformation } from "@/config/public-information";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Silver Oak Estate",
  description:
    "View confirmed weekday and weekend 24-hour booking rates, advance payment information and enquiry options for Silver Oak Estate in Sector 135, Noida.",
};

export default function PricingPage() {
  const { booking, optionalArrangements, contact } = publicInformation;
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
              PRICING & RATES · SECTOR 135, NOIDA
            </EstateEyebrow>
            <EstateHeading as="h1" variant="hero">
              Pricing at Silver Oak Estate
            </EstateHeading>
            <EstateText variant="lg" tone="muted">
              Simple, transparent 24-hour rates for exclusive access to our complete 3 BHK farmhouse, private lawn, and party pool.
            </EstateText>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* RATES & ADVANCE SECTION */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="max-w-4xl space-y-12">
            <div className="space-y-4">
              <EstateEyebrow>CONFIRMED RATES</EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Standard 24-Hour Booking Rates
              </EstateHeading>
              <EstateText tone="muted">
                The published weekday and weekend rates apply to the complete 3 BHK property.
              </EstateText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Weekday Rate Card */}
              <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-wider bg-[var(--soe-color-brand)]/10 text-[var(--soe-color-brand)] rounded-[var(--soe-radius-pill)]">
                    {booking.weekday.label}
                  </span>
                  <div className="space-y-1">
                    <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                      {weekdayRate}
                    </p>
                    <p className="font-soe-ui text-[length:var(--soe-text-sm)] text-[var(--soe-surface-text-secondary)]">
                      for {booking.durationLabel}
                    </p>
                  </div>
                  <EstateText variant="sm" tone="muted">
                    Full exclusive access to the residence, private lawn, party pool, and self-cooking kitchen.
                  </EstateText>
                </div>
              </div>

              {/* Weekend Rate Card */}
              <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-wider bg-[var(--soe-color-brand)]/10 text-[var(--soe-color-brand)] rounded-[var(--soe-radius-pill)]">
                    {booking.weekend.label}
                  </span>
                  <div className="space-y-1">
                    <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                      {weekendRate}
                    </p>
                    <p className="font-soe-ui text-[length:var(--soe-text-sm)] text-[var(--soe-surface-text-secondary)]">
                      for {booking.durationLabel}
                    </p>
                  </div>
                  <EstateText variant="sm" tone="muted">
                    Full exclusive access to the residence, private lawn, party pool, and self-cooking kitchen.
                  </EstateText>
                </div>
              </div>
            </div>

            {/* Payment Schedule & Written Confirmation Notice */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-6">
              <EstateHeading as="h3" variant="h3">
                Booking Advance & Payment Terms
              </EstateHeading>
              <ul className="space-y-3 font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Booking Advance:</strong> A flat advance payment of {advanceAmount} is required to confirm your reservation.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Balance Payment:</strong> {booking.balanceText}</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[var(--soe-surface-control-border)]/20">
                <p className="font-soe-ui text-[length:var(--soe-text-sm)] font-medium text-[var(--soe-surface-text-primary)] leading-relaxed">
                  {booking.confirmationNotice}
                </p>
              </div>

              <div className="pt-2">
                <EstateText variant="sm" tone="muted">
                  {optionalArrangements.statement}
                </EstateText>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <EstateActionLink href="/availability" variant="button">
                Check Availability
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
