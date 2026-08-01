import { buildPageMetadata } from "@/lib/seo/page-metadata";
import type { Metadata } from "next";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { publicInformation } from "@/config/public-information";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Contact Silver Oak Estate via email, phone or WhatsApp regarding availability, private stays, approved gatherings, photography shoots and optional arrangements in Sector 135, Noida.",
  path: "/contact",
});

const actionClassName =
  "min-h-11 px-4 font-soe-ui text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]";

export default function ContactPage() {
  const { booking, contact, location, optionalArrangements } =
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
          <div className="soe-motion-fade-rise grid min-h-[calc(76svh-var(--header-height))] items-end gap-12 py-14 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-8">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">
                Contact Silver Oak Estate
              </EstateEyebrow>
              <EstateHeading
                as="h1"
                variant="hero"
                className="max-w-4xl text-[length:clamp(3rem,5.2vw,6.4rem)] text-[var(--soe-surface-text-primary)]"
              >
                Begin with a considered enquiry
              </EstateHeading>
              <EstateText
                variant="lg"
                className="mt-7 max-w-2xl text-[var(--soe-surface-text-secondary)]"
              >
                The estate team can assist with availability, private stays,
                approved gatherings, photography-shoot enquiries and optional
                arrangements.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <EstateActionLink href={contact.mailtoHref} variant="button">
                  Email an Enquiry
                </EstateActionLink>
                <EstateActionLink
                  href="/availability"
                  className="border-b border-[var(--soe-color-gold)] text-[var(--soe-surface-text-primary)] no-underline"
                >
                  Check Availability
                </EstateActionLink>
              </div>
            </div>
            <p className="border-t border-[var(--soe-color-gold)]/45 pt-6 font-soe-display text-[length:var(--soe-text-xl)] text-[var(--soe-surface-text-primary)] lg:col-span-4">
              Availability and booking confirmation require written
              confirmation.
            </p>
          </div>
        </EstateContainer>
      </EstateSection>
      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="direct-contact-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Direct contact
              </EstateEyebrow>
              <EstateHeading
                id="direct-contact-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                Reach the estate in the way that suits you
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
                    <p className="mt-3 font-soe-display text-[length:var(--soe-text-xl)] text-[var(--soe-surface-text-primary)]">
                      {phone.display}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={phone.telHref}
                      className={`${actionClassName} inline-flex items-center justify-center bg-[var(--soe-color-brand)] text-[var(--soe-color-canvas)] hover:bg-[var(--soe-color-brand-strong)]`}
                    >
                      Call {phone.display}
                    </a>
                    <a
                      href={phone.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${phone.display} (opens in a new tab)`}
                      className={`${actionClassName} inline-flex items-center justify-center border border-[var(--soe-color-brand)] text-[var(--soe-color-brand)] hover:bg-[var(--soe-color-brand-soft)]`}
                    >
                      WhatsApp
                    </a>
                  </div>
                </section>
              ))}
            </div>
          </div>
          <div className="mt-16 border-y border-[var(--soe-color-gold)]/45 py-9">
            <EstateEyebrow className="text-[var(--soe-color-brand)]">
              Email
            </EstateEyebrow>
            <EstateHeading as="h2" variant="h2" className="mt-3">
              A written enquiry for considered planning
            </EstateHeading>
            <a
              href={contact.mailtoHref}
              className="mt-6 inline-flex min-h-11 items-center break-all border-b border-[var(--soe-color-brand)] font-soe-display text-[clamp(1.6rem,4vw,3.25rem)] text-[var(--soe-color-brand)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]"
            >
              {contact.email}
            </a>
          </div>
        </EstateContainer>
      </EstateSection>
      <EstateSection
        surface="dark"
        spacing="lg"
        aria-labelledby="pathways-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                Enquiry pathways
              </EstateEyebrow>
              <EstateHeading
                id="pathways-heading"
                as="h2"
                variant="h2"
                className="mt-3 text-[var(--soe-surface-text-primary)]"
              >
                Start with the kind of time you&apos;re planning
              </EstateHeading>
            </div>
            <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
              {[
                [
                  "Private stay enquiry",
                  "Share your preferred dates for a complete-property stay.",
                ],
                [
                  "Approved event or gathering enquiry",
                  "Discuss plans that require written confirmation, including events above the standard daytime capacity.",
                ],
                [
                  "Photography or optional-arrangement enquiry",
                  optionalArrangements.statement,
                ],
              ].map(([title, description]) => (
                <section
                  key={title}
                  className="border-t border-[var(--soe-color-gold)]/45 pt-5"
                >
                  <EstateHeading
                    as="h3"
                    variant="h4"
                    className="text-[var(--soe-surface-text-primary)]"
                  >
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
        surface="light"
        spacing="lg"
        aria-labelledby="enquiry-details-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Helpful details
              </EstateEyebrow>
              <EstateHeading
                id="enquiry-details-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                What to include in an enquiry
              </EstateHeading>
            </div>
            <ol className="divide-y divide-[var(--soe-color-gold)]/35 border-y border-[var(--soe-color-gold)]/45 lg:col-span-8">
              {[
                [
                  "Preferred date or date range",
                  "For the stay, gathering or visit you are considering.",
                ],
                [
                  "Nature of enquiry",
                  "Private stay, approved gathering, photography shoot or optional arrangement.",
                ],
                [
                  "Expected group size",
                  "The number of overnight guests or daytime attendees.",
                ],
                [
                  "Optional arrangement requirements",
                  "When applicable, subject to availability, written confirmation and case-by-case assessment.",
                ],
              ].map(([title, description], index) => (
                <li
                  key={title}
                  className="grid gap-4 py-5 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-soe-display text-[length:var(--soe-text-xl)] text-[var(--soe-color-brand)]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="font-soe-display text-[length:var(--soe-text-lg)]">
                      {title}
                    </p>
                    <p className="mt-2 font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-16 grid gap-8 border-t border-[var(--soe-color-gold)]/45 pt-9 lg:grid-cols-[1fr_.85fr]">
            <div>
              <EstateHeading as="h2" variant="h3">
                Written confirmation is required
              </EstateHeading>
              <EstateText tone="muted" className="mt-4">
                {booking.confirmationNotice} The required advance must be
                received, and an enquiry alone does not guarantee a reservation.
              </EstateText>
            </div>
            <address className="border-l border-[var(--soe-color-gold)]/45 pl-6 font-soe-body leading-[var(--soe-leading-body)] not-italic text-[var(--soe-surface-text-secondary)]">
              {location.fullAddress}
              <br />
              <EstateActionLink href="/location" className="mt-4">
                View Location
              </EstateActionLink>
            </address>
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <EstateActionLink href="/availability" variant="button">
              Check Availability
            </EstateActionLink>
            <EstateActionLink href={contact.mailtoHref}>
              Email an Enquiry
            </EstateActionLink>
            <EstateActionLink href="/location">View Location</EstateActionLink>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
