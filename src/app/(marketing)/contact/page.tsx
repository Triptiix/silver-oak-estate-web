import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Silver Oak Estate",
  description:
    "Email Silver Oak Estate regarding availability, private stays, approved gatherings, photography shoots and optional arrangements in Sector 135, Noida.",
};

export default function ContactPage() {
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
              Get in touch directly via email for availability, private stay reservations, or approved gathering requests.
            </EstateText>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* CONTACT DETAILS & CHECKLIST */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="max-w-4xl space-y-12">
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
                  href="mailto:contact@silveroakestate.online"
                  className="font-soe-ui text-[length:var(--soe-text-xl)] font-bold text-[var(--soe-color-brand)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--soe-color-brand)]"
                >
                  contact@silveroakestate.online
                </a>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <EstateActionLink href="mailto:contact@silveroakestate.online" variant="button">
                  Email an Enquiry
                </EstateActionLink>
                <EstateActionLink href="/availability" variant="editorial">
                  Check Availability
                </EstateActionLink>
              </div>
            </div>

            {/* Enquiry Checklist */}
            <div className="space-y-6">
              <EstateHeading as="h2" variant="h2">
                Enquiry Guidance
              </EstateHeading>
              <EstateText tone="muted">
                To help us assist you promptly, please include the following details in your email:
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
                Farm house 22, Phase 16, Green Beauty Farms, Sector 135, Noida, Uttar Pradesh 201310
              </address>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
