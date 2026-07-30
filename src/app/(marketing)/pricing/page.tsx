import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import {
  formatInrFromPaise,
  publicInformation,
} from "@/config/public-information";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  alternates: {
    canonical: "/pricing",
  },
  description:
    "View confirmed weekday and weekend rates for Silver Oak Estate’s fixed booking slot, advance payment information and enquiry options in Sector 135, Noida.",
};

export default function PricingPage() {
  const { booking, contact, optionalArrangements, tax } = publicInformation;
  const rates = [
    {
      label: booking.weekday.label,
      amount: formatInrFromPaise(booking.weekday.ratePaise),
      description: "Monday to Friday",
    },
    {
      label: booking.weekend.label,
      amount: formatInrFromPaise(booking.weekend.ratePaise),
      description: "Saturday and Sunday",
    },
  ];

  return (
    <div className="overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection
        surface="dark"
        spacing="none"
        className="border-b border-[var(--soe-color-gold)]/45"
      >
        <EstateContainer variant="visual">
          <div className="grid min-h-[calc(78svh-var(--header-height))] items-end gap-12 py-14 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-7 lg:pb-4">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">
                Sector 135, Noida
              </EstateEyebrow>
              <EstateHeading
                as="h1"
                variant="hero"
                className="max-w-4xl text-[var(--soe-surface-text-primary)]"
                style={{ fontSize: "clamp(3rem, 5.4vw, 6.6rem)" }}
              >
                Rates for the complete estate
              </EstateHeading>
              <EstateText
                variant="lg"
                className="mt-7 max-w-2xl text-[var(--soe-surface-text-secondary)]"
              >
                Published rates apply to one complete, fully furnished 3 BHK
                property for the {booking.durationLabel}.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <EstateActionLink href="/availability" variant="button">
                  Check Availability
                </EstateActionLink>
                <EstateActionLink
                  href={contact.mailtoHref}
                  className="border-b border-[var(--soe-color-gold)] text-[var(--soe-surface-text-primary)] no-underline"
                >
                  Ask a Pricing Question
                </EstateActionLink>
              </div>
            </div>
            <div className="border-t border-[var(--soe-color-gold)]/45 pt-7 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <p className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-gold)]">
                Standard booking period
              </p>
              <p className="mt-4 font-soe-display text-[length:var(--soe-text-2xl)] text-[var(--soe-surface-text-primary)]">
                {booking.durationLabel}
              </p>
              <p className="mt-5 border-l border-[var(--soe-color-gold)] pl-4 font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                {booking.slotStatement}
              </p>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="light" spacing="lg" aria-labelledby="rates-heading">
        <EstateContainer variant="visual">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Published rates
              </EstateEyebrow>
              <EstateHeading id="rates-heading" as="h2" variant="h2" className="mt-3">
                A considered stay, held as one property
              </EstateHeading>
              <EstateText tone="muted" className="mt-6">
                Each rate is for the complete property and the same {booking.durationLabel}, from {booking.checkIn.timeLabel} to {booking.checkOut.timeLabel}.
              </EstateText>
            </div>
            <dl className="border-y border-[var(--soe-color-gold)]/45 lg:col-span-8 lg:grid lg:grid-cols-2">
              {rates.map((rate, index) => (
                <div
                  key={rate.label}
                  className={`py-9 ${index === 0 ? "border-b border-[var(--soe-color-gold)]/45 lg:border-b-0 lg:border-r lg:pr-10" : "lg:pl-10"}`}
                >
                  <dt className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-brand)]">
                    {rate.label}
                  </dt>
                  <dd className="mt-5 font-soe-display text-[clamp(3.5rem,7vw,6.5rem)] leading-none tracking-[var(--soe-tracking-display)] text-[var(--soe-surface-text-primary)]">
                    {rate.amount}
                  </dd>
                  <dd className="mt-5 font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                    {rate.description}. Complete-property rate for the {booking.durationLabel}.
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="dark" spacing="lg" aria-labelledby="payment-heading">
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                Planning a booking
              </EstateEyebrow>
              <EstateHeading id="payment-heading" as="h2" variant="h2" className="mt-3 text-[var(--soe-surface-text-primary)]">
                A clear written-confirmation sequence
              </EstateHeading>
            </div>
            <ol className="divide-y divide-[var(--soe-color-gold)]/35 border-y border-[var(--soe-color-gold)]/45 lg:col-span-8">
              {[
                "Check preferred dates.",
                "Receive written pricing and availability confirmation.",
                `Pay the ${formatInrFromPaise(booking.advancePaise)} advance after confirmation.`,
                booking.balanceText,
              ].map((step, index) => (
                <li key={step} className="grid gap-4 py-5 sm:grid-cols-[3rem_1fr]">
                  <span className="font-soe-display text-[length:var(--soe-text-xl)] text-[var(--soe-color-gold)]">
                    0{index + 1}
                  </span>
                  <span className="font-soe-body text-[length:var(--soe-text-lg)] leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-primary)]">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="light" spacing="lg" aria-labelledby="confirmation-heading">
        <EstateContainer variant="reading">
          <div className="border-y border-[var(--soe-color-gold)]/45 py-9">
            <EstateEyebrow className="text-[var(--soe-color-brand)]">
              Confirmation and tax
            </EstateEyebrow>
            <EstateHeading id="confirmation-heading" as="h2" variant="h2" className="mt-3">
              Final details are confirmed before payment
            </EstateHeading>
            <EstateText tone="muted" className="mt-6">
              {booking.confirmationNotice}
            </EstateText>
            <EstateText tone="muted" className="mt-4">
              {tax.currentStatement}
            </EstateText>
            <EstateText tone="muted" className="mt-4">
              {optionalArrangements.statement}
            </EstateText>
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <EstateActionLink href="/availability" variant="button">
              Check Availability
            </EstateActionLink>
            <EstateActionLink href={contact.mailtoHref}>Email an Enquiry</EstateActionLink>
            <EstateActionLink href="/contact">Discuss an Approved Event</EstateActionLink>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
