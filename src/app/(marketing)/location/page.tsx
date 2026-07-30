import { buildPageMetadata } from "@/lib/seo/page-metadata";
import type { Metadata } from "next";
import Image from "next/image";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateMediaFrame } from "@/components/estate-ui/estate-media-frame";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import { publicInformation } from "@/config/public-information";

export const metadata: Metadata = buildPageMetadata({
  title: "Location | Silver Oak Estate, Sector 135 Noida",
  description: `Find Silver Oak Estate at ${publicInformation.location.fullAddress} and open the official Google Maps location.`,
  path: "/location",
  absoluteTitle: true,
});

export default function LocationPage() {
  const { location, parking } = publicInformation;

  return (
    <div className="overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection
        surface="dark"
        spacing="none"
        className="border-b border-[var(--soe-color-gold)]/45"
      >
        <div className="grid min-h-[calc(82svh-var(--header-height))] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center px-4 py-14 sm:px-8 lg:pl-[max(3rem,calc((100vw-var(--soe-container-visual))/2+2rem))] lg:pr-12">
            <div className="max-w-[36rem]">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">
                Green Beauty Farms · Sector 135, Noida
              </EstateEyebrow>
              <EstateHeading
                as="h1"
                variant="hero"
                className="text-[length:clamp(3rem,5vw,6.2rem)] text-[var(--soe-surface-text-primary)]"
              >
                Find the estate
              </EstateHeading>
              <EstateText
                variant="lg"
                className="mt-7 text-[var(--soe-surface-text-secondary)]"
              >
                Silver Oak Estate is located within Green Beauty Farms in Sector
                135, Noida.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <EstateActionLink
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open in Google Maps (opens in a new tab)"
                  variant="button"
                >
                  Open in Google Maps
                </EstateActionLink>
                <EstateActionLink
                  href="/availability"
                  className="border-b border-[var(--soe-color-gold)] text-[var(--soe-surface-text-primary)] no-underline"
                >
                  Check Availability
                </EstateActionLink>
              </div>
            </div>
          </div>
          <EstateMediaFrame
            aspectRatio="landscape"
            className="min-h-[45svh] rounded-none lg:min-h-full"
          >
            <Image
              src="/images/estate/home/hero-estate-exterior.webp"
              alt="Exterior view of Silver Oak Estate private farmhouse in Sector 135, Noida"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 58vw"
              className="object-cover"
            />
          </EstateMediaFrame>
        </div>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="address-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Estate address
              </EstateEyebrow>
              <EstateHeading
                id="address-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                A clear destination for your visit
              </EstateHeading>
            </div>
            <address className="border-y border-[var(--soe-color-gold)]/45 py-9 font-soe-display text-[clamp(2rem,4vw,4rem)] leading-[1.12] tracking-[var(--soe-tracking-display)] not-italic text-[var(--soe-surface-text-primary)] lg:col-span-8">
              {location.fullAddress}
            </address>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="dark"
        spacing="lg"
        aria-labelledby="parking-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                Parking
              </EstateEyebrow>
              <EstateHeading
                id="parking-heading"
                as="h2"
                variant="h2"
                className="mt-3 text-[var(--soe-surface-text-primary)]"
              >
                Space for arrivals
              </EstateHeading>
              <EstateText className="mt-6 text-[var(--soe-surface-text-secondary)]">
                {parking.summary}
              </EstateText>
            </div>
            <dl className="divide-y divide-[var(--soe-color-gold)]/35 border-y border-[var(--soe-color-gold)]/45 lg:col-span-8">
              <div className="grid gap-4 py-7 sm:grid-cols-[minmax(12rem,.7fr)_1.3fr]">
                <dt className="font-soe-display text-[length:var(--soe-text-2xl)] text-[var(--soe-surface-text-primary)]">
                  {parking.inside.valueLabel}
                </dt>
                <dd className="font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                  {parking.inside.description}
                </dd>
              </div>
              <div className="grid gap-4 py-7 sm:grid-cols-[minmax(12rem,.7fr)_1.3fr]">
                <dt className="font-soe-display text-[length:var(--soe-text-2xl)] text-[var(--soe-surface-text-primary)]">
                  {parking.outside.valueLabel}
                </dt>
                <dd className="font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                  {parking.outside.description}
                </dd>
              </div>
            </dl>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="travel-heading"
      >
        <EstateContainer variant="reading">
          <EstateEyebrow className="text-[var(--soe-color-brand)]">
            Before travelling
          </EstateEyebrow>
          <EstateHeading
            id="travel-heading"
            as="h2"
            variant="h2"
            className="mt-3"
          >
            Plan the details with the estate team
          </EstateHeading>
          <ul className="mt-8 divide-y divide-[var(--soe-color-gold)]/35 border-y border-[var(--soe-color-gold)]/45 font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
            <li className="py-5">
              Open the official Google Maps destination before your visit.
            </li>
            <li className="py-5">
              Confirm visit or booking details with the estate team.
            </li>
            <li className="py-5">
              Use the estate&apos;s contact channels if further coordination is
              required.
            </li>
          </ul>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <EstateActionLink
              href={location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in Google Maps (opens in a new tab)"
              variant="button"
            >
              Open in Google Maps
            </EstateActionLink>
            <EstateActionLink href="/availability">
              Check Availability
            </EstateActionLink>
            <EstateActionLink href="/contact">
              Contact the Estate
            </EstateActionLink>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
