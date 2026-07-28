import type { Metadata } from "next";
import Image from "next/image";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateText } from "@/components/estate-ui/estate-text";
import { EstateMediaFrame } from "@/components/estate-ui/estate-media-frame";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateStatCard } from "@/components/estate-ui/estate-stat-card";
import { publicInformation } from "@/config/public-information";

export const metadata: Metadata = {
  title: "The Estate | Silver Oak Estate Private Farmhouse in Noida",
  description:
    "Explore the fully furnished 3 BHK residence, lawn, pool, kitchen and private gathering spaces at Silver Oak Estate in Sector 135, Noida.",
};

export default function EstatePage() {
  return (
    <div className="flex flex-col">
      {/* A. EDITORIAL HERO */}
      <EstateSection surface="dark" spacing="lg" className="py-12 md:py-20">
        <EstateContainer variant="visual">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                THE ESTATE · SECTOR 135, NOIDA
              </EstateEyebrow>
              <EstateHeading as="h1" variant="hero" className="text-[var(--soe-surface-text-primary)]">
                A Complete Private Estate for Time Together
              </EstateHeading>
              <EstateText variant="lg" className="text-[var(--soe-surface-text-secondary)]">
                Silver Oak Estate is a fully furnished 3 BHK farmhouse created for private
                stays, family time, small-group retreats and approved gatherings in Sector
                135, Noida.
              </EstateText>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <EstateActionLink variant="button" href="/availability">
                  Check Availability
                </EstateActionLink>
                <EstateActionLink
                  variant="editorial"
                  href="/gallery"
                  className="text-[var(--soe-surface-text-primary)]"
                >
                  View the Gallery →
                </EstateActionLink>
              </div>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape" className="w-full">
                <Image
                  src="/images/estate/estate/estate-hero.webp"
                  alt="Exterior view of Silver Oak Estate residence and private grounds in Sector 135, Noida"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* B. ESTATE AT A GLANCE */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="mb-10">
            <EstateEyebrow className="text-[var(--soe-color-brand)] mb-2">
              OVERVIEW
            </EstateEyebrow>
            <EstateHeading as="h2" variant="h2">
              The Estate at a Glance
            </EstateHeading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <EstateStatCard
              label="Residence"
              value="Fully furnished 3 BHK"
              description="Three themed king-bed bedrooms with air conditioning"
            />
            <EstateStatCard
              label="Baths & Changing"
              value="4 Bathrooms + Changing"
              description="Three attached bathrooms, one lawn bathroom, and pool changing room"
            />
            <EstateStatCard
              label="Overnight Stays"
              value={publicInformation.capacity.overnightLabel}
              description="Comfortable sleeping capacity for families and small groups"
            />
            <EstateStatCard
              label="Day Events & Gatherings"
              value={publicInformation.capacity.standardDayEventLabel}
              description="Lawn, pool deck, and outdoor space for approved celebrations"
            />
            <EstateStatCard
              label="Indoor Capacity"
              value={publicInformation.capacity.indoorLabel}
              description="Hall seating for up to 15 and dedicated dining seating for 5"
            />
            <EstateStatCard
              label="Grounds & Pool"
              value="Private Lawn & Party Pool"
              description="Spacious open-air grounds with poolside deck area"
            />
          </div>
        </EstateContainer>
      </EstateSection>

      {/* C. INSIDE THE RESIDENCE */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
            <div className="lg:col-span-6 space-y-6">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                INTERIOR SPACES
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Comfortable Spaces for Unhurried Stays
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                The main residence features three themed king-bed bedrooms, designed for a restful overnight experience. Each bedroom includes air conditioning and direct access to an attached bathroom.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Furnished indoor living and gathering areas provide a welcoming space for conversation, relaxation, and togetherness, complete with climate control and essential toiletries.
              </EstateText>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/estate/estate-living-area.webp"
                  alt="Indoor seating area with two chairs and a table at Silver Oak Estate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/estate/estate-bedroom.webp"
                  alt="Bedroom with a king bed at Silver Oak Estate"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
              <p className="font-soe-ui text-[length:var(--soe-text-sm)] font-semibold text-[var(--soe-surface-text-primary)]">
                King-Bed Bedrooms
              </p>
              <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)]">
                Air-conditioned bedrooms with comfortable furnishings
              </p>
            </div>

            <div className="space-y-3">
              <EstateMediaFrame aspectRatio="portrait" className="max-h-[300px]">
                <Image
                  src="/images/estate/estate/estate-bathroom.webp"
                  alt="Clean attached bathroom at Silver Oak Estate"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
              <p className="font-soe-ui text-[length:var(--soe-text-sm)] font-semibold text-[var(--soe-surface-text-primary)]">
                Attached Bathrooms
              </p>
              <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)]">
                Private, well-maintained attached bathrooms with essential toiletries
              </p>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* D. KITCHEN AND DINING */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <EstateMediaFrame aspectRatio="landscape">
                  <Image
                    src="/images/estate/estate/estate-kitchen.webp"
                    alt="Modular kitchen equipped with stove, induction and oven"
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    className="object-cover"
                  />
                </EstateMediaFrame>
                <EstateMediaFrame aspectRatio="landscape">
                  <Image
                    src="/images/estate/estate/estate-dining.webp"
                    alt="Dedicated dining table and seating area"
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    className="object-cover"
                  />
                </EstateMediaFrame>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                KITCHEN & DINING
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                A Kitchen Made for Shared Meals
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                The estate includes a modular kitchen set up for self-cooking and food preparation. Equipped with a stove, induction cooktop, oven, utensils, and general cooking equipment.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Filtered RO drinking water is provided. An adjoining dedicated dining area offers comfortable seating for 5, while outdoor BBQ equipment is available for open-air grilling.
              </EstateText>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* E. LAWN, POOL AND OUTDOOR SPACES */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
            <div className="lg:col-span-6 space-y-6">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                OUTDOOR & GROUNDS
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Open-Air Time, from Lawn to Poolside
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                Enjoy expansive open-air space on the private lawn and around the adult-size party pool. Pool access is available during the {publicInformation.booking.durationLabel}, subject to operational availability, maintenance and caretaker instructions. A pool changing room and separate lawn bathroom are provided.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Outdoor entertainment amenities include an outdoor projector screen, speaker, board games, and BBQ equipment for evening gatherings.
              </EstateText>
            </div>
            <div className="lg:col-span-6 space-y-6">
              <EstateMediaFrame aspectRatio="cinema">
                <Image
                  src="/images/estate/estate/estate-pool-deck.webp"
                  alt="Adult-size party pool and deck at Silver Oak Estate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/estate/estate-lawn-evening.webp"
                  alt="Evening view of the private lawn and grounds at Silver Oak Estate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* F. ESSENTIAL COMFORTS AND OPERATIONS */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="p-8 md:p-12 rounded-[var(--soe-radius-card)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20">
            <div className="mb-8">
              <EstateEyebrow className="text-[var(--soe-color-brand)] mb-2">
                OPERATIONS & AMENITIES
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Prepared for a Comfortable Private Booking
              </EstateHeading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <EstateHeading as="h3" variant="h4" className="text-[var(--soe-color-brand)]">
                  Comfort
                </EstateHeading>
                <ul className="space-y-2 text-[length:var(--soe-text-sm)] text-[var(--soe-surface-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Air conditioning in bedrooms, hall, kitchen and dining area
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Wi-Fi
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    RO drinking water
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Toiletries
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <EstateHeading as="h3" variant="h4" className="text-[var(--soe-color-brand)]">
                  Power & Security
                </EstateHeading>
                <ul className="space-y-2 text-[length:var(--soe-text-sm)] text-[var(--soe-surface-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Diesel generator backup
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Solar power support
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Emergency lighting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    24/7 caretaker presence
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    CCTV security
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <EstateHeading as="h3" variant="h4" className="text-[var(--soe-color-brand)]">
                  Parking & Access
                </EstateHeading>
                <ul className="space-y-2 text-[length:var(--soe-text-sm)] text-[var(--soe-surface-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Approximately 3 vehicles inside
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    10 or more vehicles outside
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--soe-color-brand)] font-bold">•</span>
                    Green Beauty Farms, Sector 135, Noida
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* G. CAPACITY AND BOOKING CONTEXT */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="max-w-3xl space-y-6">
            <EstateEyebrow className="text-[var(--soe-color-brand)]">
              GUEST CAPACITY
            </EstateEyebrow>
            <EstateHeading as="h2" variant="h2">
              Designed Around Your Group
            </EstateHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <EstateStatCard
                variant="capacity"
                label="Overnight Stays"
                value={publicInformation.capacity.overnightLabel}
                description="Full 3 BHK house accommodation"
              />
              <EstateStatCard
                variant="capacity"
                label="Indoor Gatherings"
                value={publicInformation.capacity.indoorLabel}
                description="Hall seating for up to 15 and dining seating for 5"
              />
              <EstateStatCard
                variant="capacity"
                label="Day Events & Gatherings"
                value={publicInformation.capacity.standardDayEventLabel}
                description="Lawn and pool-deck open-air capacity"
              />
              <EstateStatCard
                variant="capacity"
                label="Parking"
                value={`${publicInformation.parking.inside.valueLabel} Inside · ${publicInformation.parking.outside.valueLabel} Outside`}
                description="Final parking arrangements must be confirmed with the estate team"
              />
            </div>
            <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] pt-4 border-t border-[var(--soe-surface-control-border)]/15">
              {publicInformation.capacity.largerEventStatement} Final guest count, event requirements and permitted arrangements must be confirmed with the estate team before booking.
            </p>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* H. FINAL ACTION SECTION */}
      <EstateSection surface="dark" spacing="lg" className="py-16 md:py-24 text-center">
        <EstateContainer variant="reading">
          <div className="space-y-6">
            <EstateHeading as="h2" variant="h2" className="text-[var(--soe-surface-text-primary)]">
              Reserve the Estate for Your Time Together
            </EstateHeading>
            <EstateText variant="lg" className="text-[var(--soe-surface-text-secondary)]">
              Check availability for a private stay or contact the estate team to discuss an approved gathering or event.
            </EstateText>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <EstateActionLink variant="button" href="/availability">
                Check Availability
              </EstateActionLink>
              <EstateActionLink
                variant="editorial"
                href="/contact"
                className="text-[var(--soe-surface-text-primary)]"
              >
                Plan an Event →
              </EstateActionLink>
              <EstateActionLink
                variant="editorial"
                href="mailto:contact@silveroakestate.online"
                className="text-[var(--soe-surface-text-primary)]"
              >
                Email the Estate →
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
