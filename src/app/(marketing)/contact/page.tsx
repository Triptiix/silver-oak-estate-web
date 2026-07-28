import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { publicInformation } from "@/config/public-information";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Silver Oak Estate",
  description:
    "Contact Silver Oak Estate via email, phone or WhatsApp regarding availability, private stays, approved gatherings, photography shoots and optional arrangements in Sector 135, Noida.",
};

export default function ContactPage() {
  const { contact, location } = publicInformation;

  return (
    <div className="min-h-screen bg-[var(--soe-surface-bg-primary)] text-[var(--soe-surface-text-primary)]">
      {/* HERO SECTION */}
      <EstateSection surface="dark" spacing="lg">
        <EstateContainer variant="content">
          <div className="max-w-3xl space-y-6">
            <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
              DIRECT ENQUIRIES · SECTOR 135, NOIDA
            </EstateEyebrow>
            <EstateHeading as="h1" variant="hero">
              Contact & Enquiries
            </EstateHeading>
            <EstateText variant="lg" tone="muted">
              Get in touch directly via email, phone, or WhatsApp for availability, private stay reservations, or approved gathering requests.
            </EstateText>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* CONTACT DETAILS & CHECKLIST */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="max-w-4xl space-y-12">
            {/* Phone & WhatsApp Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Primary Contact Card */}
              <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    PRIMARY PHONE & WHATSAPP
                  </p>
                  <EstateHeading as="h2" variant="h2">
                    Primary Contact
                  </EstateHeading>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {contact.primaryPhone.display}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    Call or send a message on WhatsApp for enquiry assistance.
                  </EstateText>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href={contact.primaryPhone.telHref}
                    className="inline-flex items-center justify-center px-4 py-2 text-[length:var(--soe-text-sm)] font-semibold font-soe-ui text-white bg-[var(--soe-color-brand)] rounded-[var(--soe-radius-control)] hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--soe-color-brand)]"
                  >
                    Call {contact.primaryPhone.display}
                  </a>
                  <a
                    href={contact.primaryPhone.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${contact.primaryPhone.display}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-[length:var(--soe-text-sm)] font-semibold font-soe-ui text-[var(--soe-color-brand)] border border-[var(--soe-color-brand)] rounded-[var(--soe-radius-control)] hover:bg-[var(--soe-color-brand)]/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--soe-color-brand)]"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Secondary Contact Card */}
              <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    SECONDARY PHONE & WHATSAPP
                  </p>
                  <EstateHeading as="h2" variant="h2">
                    Secondary Contact
                  </EstateHeading>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {contact.secondaryPhone.display}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    Alternate contact line for booking support and event queries.
                  </EstateText>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href={contact.secondaryPhone.telHref}
                    className="inline-flex items-center justify-center px-4 py-2 text-[length:var(--soe-text-sm)] font-semibold font-soe-ui text-white bg-[var(--soe-color-brand)] rounded-[var(--soe-radius-control)] hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--soe-color-brand)]"
                  >
                    Call {contact.secondaryPhone.display}
                  </a>
                  <a
                    href={contact.secondaryPhone.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${contact.secondaryPhone.display}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-[length:var(--soe-text-sm)] font-semibold font-soe-ui text-[var(--soe-color-brand)] border border-[var(--soe-color-brand)] rounded-[var(--soe-radius-control)] hover:bg-[var(--soe-color-brand)]/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--soe-color-brand)]"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Email Card */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8 space-y-6">
              <div className="space-y-2">
                <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                  CANONICAL EMAIL
                </p>
                <EstateHeading as="h2" variant="h2">
                  Direct Email Enquiry
                </EstateHeading>
                <EstateText tone="muted">
                  For reservations, private stays, approved gatherings or photography-shoot enquiries, please reach out to us at:
                </EstateText>
              </div>

              <div className="pt-2">
                <a
                  href={contact.mailtoHref}
                  className="font-soe-ui text-[length:var(--soe-text-xl)] font-bold text-[var(--soe-color-brand)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--soe-color-brand)]"
                >
                  {contact.email}
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[var(--soe-surface-control-border)]/20">
                <EstateActionLink href={contact.mailtoHref} variant="button">
                  Email an Enquiry
                </EstateActionLink>
                <EstateActionLink href="/availability" variant="editorial">
                  Check Availability
                </EstateActionLink>
              </div>

              <p className="font-soe-ui text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] italic">
                Availability and bookings are confirmed only through written confirmation and receipt of the required advance.
              </p>
            </div>

            {/* Enquiry Checklist */}
            <div className="space-y-6">
              <EstateHeading as="h2" variant="h2">
                Enquiry Guidance
              </EstateHeading>
              <EstateText tone="muted">
                To help us assist you promptly, please include the following details in your enquiry:
              </EstateText>
              <ul className="space-y-3 font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-secondary)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Preferred Date(s):</strong> Preferred booking date or date range.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Nature of Enquiry:</strong> Private stay or approved gathering.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Expected Group Size:</strong> Total number of overnight guests or daytime attendees.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-[var(--soe-color-brand)] shrink-0" />
                  <span><strong>Optional Arrangements:</strong> Catering, DJ arrangements, or photography shoot requirements.</span>
                </li>
              </ul>
            </div>

            {/* Property Address Card */}
            <div className="space-y-4">
              <EstateHeading as="h2" variant="h2">
                Property Address
              </EstateHeading>
              <address className="not-italic font-soe-ui text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-primary)] leading-relaxed bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-6">
                {location.fullAddress}
              </address>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
