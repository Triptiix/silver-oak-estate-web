import type { Metadata } from "next";
import { AvailabilityFlow } from "@/components/booking/availability-flow";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { publicInformation } from "@/config/public-information";
import { getAvailabilityCapability } from "@/lib/capabilities/online-booking";

export const metadata: Metadata = {
  title: "Availability | Silver Oak Estate",
  description:
    "Review preferred dates and contact the Silver Oak Estate team for written availability confirmation for private stays and approved gatherings.",
};

const directActionClassName =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--soe-radius-control)] px-4 font-soe-ui text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]";

export default function AvailabilityPage() {
  const availability = getAvailabilityCapability();
  const { booking, capacity, contact, optionalArrangements, tax } =
    publicInformation;
  const contacts = [
    { label: "Primary", phone: contact.primaryPhone },
    { label: "Secondary", phone: contact.secondaryPhone },
  ];

  return (
    <div className="overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection
        surface="dark"
        spacing="none"
        className="border-b border-[var(--soe-color-gold)]/45"
      >
        <EstateContainer variant="visual">
          <div className="grid min-h-[calc(76svh-var(--header-height))] items-end gap-12 py-14 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-8">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">
                Availability · Assisted enquiry
              </EstateEyebrow>
              <EstateHeading
                as="h1"
                variant="hero"
                className="max-w-4xl text-[length:clamp(3rem,5.2vw,6.4rem)] text-[var(--soe-surface-text-primary)]"
              >
                Begin with your preferred dates
              </EstateHeading>
              <EstateText
                variant="lg"
                className="mt-7 max-w-2xl text-[var(--soe-surface-text-secondary)]"
              >
                Explore the calendar when available, then share your plans with
                the estate team. Final availability is always subject to written
                confirmation.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <EstateActionLink
                  href={contact.primaryPhone.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Request availability on WhatsApp at ${contact.primaryPhone.display} (opens in a new tab)`}
                  variant="button"
                >
                  Request Availability
                </EstateActionLink>
                <EstateActionLink
                  href={contact.mailtoHref}
                  className="min-h-11 border-b border-[var(--soe-color-gold)] text-[var(--soe-surface-text-primary)] no-underline"
                >
                  Email the Estate
                </EstateActionLink>
              </div>
            </div>
            <p className="border-t border-[var(--soe-color-gold)]/45 pt-6 font-soe-display text-[length:var(--soe-text-xl)] text-[var(--soe-surface-text-primary)] lg:col-span-4">
              An enquiry does not reserve the estate. Written confirmation is
              required.
            </p>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="calendar-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Preferred dates
              </EstateEyebrow>
              <EstateHeading
                id="calendar-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                Check the calendar, then enquire
              </EstateHeading>
              <EstateText tone="muted" className="mt-6">
                Calendar information helps with planning, but it is not an
                instant-booking promise. A selected date remains unreserved
                until the estate team confirms it in writing.
              </EstateText>
            </div>
            <div className="lg:col-span-8">
              {availability.available ? (
                <AvailabilityFlow onlineBookingAvailable={false} />
              ) : (
                <div className="border-y border-[var(--soe-color-gold)]/45 py-10">
                  <EstateHeading as="h3" variant="h3">
                    Ask the estate team for current availability
                  </EstateHeading>
                  <EstateText tone="muted" className="mt-4 max-w-2xl">
                    The calendar is temporarily unavailable. Share your
                    preferred date or date range by phone, WhatsApp or email for
                    an assisted check.
                  </EstateText>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <EstateActionLink
                      href={contact.primaryPhone.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${contact.primaryPhone.display} (opens in a new tab)`}
                      variant="button"
                    >
                      WhatsApp the Estate
                    </EstateActionLink>
                    <EstateActionLink
                      href={contact.mailtoHref}
                      className="min-h-11"
                    >
                      Email an Enquiry
                    </EstateActionLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="dark"
        spacing="lg"
        aria-labelledby="prepare-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                Prepare your enquiry
              </EstateEyebrow>
              <EstateHeading
                id="prepare-heading"
                as="h2"
                variant="h2"
                className="mt-3 text-[var(--soe-surface-text-primary)]"
              >
                A few details help the team respond clearly
              </EstateHeading>
            </div>
            <ol className="divide-y divide-[var(--soe-color-gold)]/35 border-y border-[var(--soe-color-gold)]/45 lg:col-span-8">
              {[
                [
                  "Preferred date or date range",
                  "Share the date, range or alternatives you are considering.",
                ],
                [
                  "Stay or occasion",
                  "Mention whether you are planning an overnight stay, gathering, photography shoot or another approved use.",
                ],
                [
                  "Expected group size",
                  "Include overnight guests and daytime attendees where relevant.",
                ],
                [
                  "Arrangements and reply details",
                  "Describe optional arrangements you want to discuss and provide the best contact details for a reply.",
                ],
              ].map(([title, description], index) => (
                <li
                  key={title}
                  className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-soe-display text-[length:var(--soe-text-xl)] text-[var(--soe-surface-accent-metal)]">
                    0{index + 1}
                  </span>
                  <div>
                    <EstateHeading
                      as="h3"
                      variant="h4"
                      className="text-[var(--soe-surface-text-primary)]"
                    >
                      {title}
                    </EstateHeading>
                    <p className="mt-2 font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="pathways-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Stay and event pathways
              </EstateEyebrow>
              <EstateHeading
                id="pathways-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                One estate, considered for different occasions
              </EstateHeading>
              <EstateText tone="muted" className="mt-6">
                Silver Oak Estate is offered as one complete property, never as
                independently bookable rooms.
              </EstateText>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
              {[
                [
                  "Overnight stays",
                  `${capacity.overnightLabel}. ${booking.slotStatement}`,
                ],
                [
                  "Daytime gatherings",
                  `${capacity.standardDayEventLabel} for standard daytime events. Indoor gatherings support ${capacity.indoorLabel.toLowerCase()}.`,
                ],
                [
                  "Larger events",
                  capacity.largerEventStatement,
                ],
                [
                  "Photography and arrangements",
                  optionalArrangements.statement,
                ],
              ].map(([title, description]) => (
                <section
                  key={title}
                  className="border-t border-[var(--soe-color-gold)]/45 pt-5"
                >
                  <EstateHeading as="h3" variant="h4">
                    {title}
                  </EstateHeading>
                  <p className="mt-4 font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                    {description}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="dark"
        spacing="lg"
        aria-labelledby="confirmation-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                From preference to confirmation
              </EstateEyebrow>
              <EstateHeading
                id="confirmation-heading"
                as="h2"
                variant="h2"
                className="mt-3 text-[var(--soe-surface-text-primary)]"
              >
                Know what each step means
              </EstateHeading>
            </div>
            <ol className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
              {[
                [
                  "Preferred date",
                  "A date or range you would like the team to review.",
                ],
                [
                  "Enquiry",
                  "Your request for availability and planning details. It does not reserve the estate.",
                ],
                [
                  "Written confirmation",
                  "The estate team confirms availability and commercial details in writing.",
                ],
                [
                  "Confirmed reservation",
                  "A reservation exists only after the required written confirmation is issued.",
                ],
              ].map(([title, description], index) => (
                <li
                  key={title}
                  className="border-t border-[var(--soe-color-gold)]/45 pt-5"
                >
                  <p className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-surface-accent-metal)]">
                    Step 0{index + 1}
                  </p>
                  <EstateHeading
                    as="h3"
                    variant="h4"
                    className="mt-3 text-[var(--soe-surface-text-primary)]"
                  >
                    {title}
                  </EstateHeading>
                  <p className="mt-3 font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-14 border-t border-[var(--soe-color-gold)]/45 pt-8">
            <EstateText className="max-w-3xl text-[var(--soe-surface-text-secondary)]">
              {booking.confirmationNotice} {tax.currentStatement}
            </EstateText>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="contact-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Direct contact
              </EstateEyebrow>
              <EstateHeading
                id="contact-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                Share your dates with the estate team
              </EstateHeading>
            </div>
            <div className="border-y border-[var(--soe-color-gold)]/45 lg:col-span-8">
              {contacts.map(({ label, phone }) => (
                <section
                  key={label}
                  className="grid gap-6 border-b border-[var(--soe-color-gold)]/35 py-7 last:border-b-0 sm:grid-cols-[minmax(10rem,.6fr)_1.4fr]"
                >
                  <div>
                    <p className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-brand)]">
                      {label} phone
                    </p>
                    <p className="mt-3 font-soe-display text-[length:var(--soe-text-xl)]">
                      {phone.display}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={phone.telHref}
                      className={`${directActionClassName} bg-[var(--soe-color-brand)] text-[var(--soe-color-canvas)] hover:bg-[var(--soe-color-brand-strong)]`}
                    >
                      Call {phone.display}
                    </a>
                    <a
                      href={phone.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${phone.display} (opens in a new tab)`}
                      className={`${directActionClassName} border border-[var(--soe-color-brand)] text-[var(--soe-color-brand)] hover:bg-[var(--soe-color-brand-soft)]`}
                    >
                      WhatsApp
                    </a>
                  </div>
                </section>
              ))}
              <div className="py-8">
                <p className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-brand)]">
                  Email
                </p>
                <a
                  href={contact.mailtoHref}
                  className={`${directActionClassName} mt-4 break-all border border-[var(--soe-color-brand)] text-[var(--soe-color-brand)] hover:bg-[var(--soe-color-brand-soft)]`}
                >
                  {contact.email}
                </a>
              </div>
            </div>
          </div>
          <div className="mt-16 grid gap-8 border-t border-[var(--soe-color-gold)]/45 pt-9 lg:grid-cols-[1fr_.85fr]">
            <div>
              <EstateHeading as="h2" variant="h3">
                Your next step
              </EstateHeading>
              <EstateText tone="muted" className="mt-4">
                Share your preferred dates and enquiry details. The estate team
                will review the request and confirm availability and commercial
                details in writing. No reservation exists until that written
                confirmation is issued.
              </EstateText>
            </div>
            <div className="flex flex-col items-start gap-4 border-l border-[var(--soe-color-gold)]/45 pl-6">
              <EstateActionLink
                href={contact.primaryPhone.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Request availability on WhatsApp at ${contact.primaryPhone.display} (opens in a new tab)`}
                variant="button"
              >
                Request Availability
              </EstateActionLink>
              <EstateActionLink
                href={contact.mailtoHref}
                className="min-h-11"
              >
                Email the Estate
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
