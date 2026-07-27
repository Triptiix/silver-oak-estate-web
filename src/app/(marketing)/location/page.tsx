import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { publicInformation } from "@/config/public-information";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location | Silver Oak Estate, Sector 135 Noida",
  description:
    `Find Silver Oak Estate at ${publicInformation.location.fullAddress} and open the official Google Maps location.`,
};

export default function LocationPage() {
  const { location, parking } = publicInformation;

  return (
    <div className="min-h-screen bg-[var(--soe-surface-bg-primary)] text-[var(--soe-surface-text-primary)]">
      {/* HERO SECTION */}
      <EstateSection surface="dark" spacing="lg">
        <EstateContainer variant="content">
          <div className="max-w-3xl space-y-6">
            <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
              LOCATION · SECTOR 135, NOIDA
            </EstateEyebrow>
            <EstateHeading as="h1" variant="hero">
              Location & Address
            </EstateHeading>
            <EstateText variant="lg" tone="muted">
              Situated within Green Beauty Farms in Sector 135, Noida.
            </EstateText>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* ADDRESS & PARKING DETAILS */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="max-w-4xl space-y-12">
            {/* Property Address */}
            <div className="space-y-4">
              <EstateEyebrow>CONFIRMED ADDRESS</EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Property Address
              </EstateHeading>
              <address className="not-italic font-soe-ui text-[length:var(--soe-text-lg)] text-[var(--soe-surface-text-primary)] leading-relaxed bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-8">
                {location.fullAddress}
              </address>
            </div>

            {/* Parking Information */}
            <div className="space-y-6">
              <EstateHeading as="h2" variant="h2">
                Parking
              </EstateHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-6 space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    ON-SITE PARKING
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {parking.inside.valueLabel}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    {parking.inside.description}
                  </EstateText>
                </div>

                <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] p-6 space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    OUTSIDE PARKING
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-2xl)] font-bold text-[var(--soe-surface-text-primary)]">
                    {parking.outside.valueLabel}
                  </p>
                  <EstateText variant="sm" tone="muted">
                    {parking.outside.description}
                  </EstateText>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <EstateActionLink
                href={location.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="button"
              >
                Open in Google Maps
              </EstateActionLink>
              <EstateActionLink href="/availability" variant="editorial">
                Check Availability
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
