import type { Metadata } from "next";
import Image from "next/image";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateText } from "@/components/estate-ui/estate-text";
import { EstateMediaFrame } from "@/components/estate-ui/estate-media-frame";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { formatInrFromPaise, publicInformation } from "@/config/public-information";

export const metadata: Metadata = {
  title: "Silver Oak Estate | Private Farmhouse Stay & Event Venue in Noida",
  description:
    "Discover Silver Oak Estate, a private farmhouse in Sector 135, Noida for stays, family gatherings, corporate retreats and private celebrations.",
};

export default function HomePage() {
  const { booking, capacity } = publicInformation;
  const weekdayRate = formatInrFromPaise(booking.weekday.ratePaise);
  const weekendRate = formatInrFromPaise(booking.weekend.ratePaise);
  const advanceAmount = formatInrFromPaise(booking.advancePaise);

  return (
    <div className="flex flex-col">
      {/* A. HERO */}
      <EstateSection surface="dark" spacing="lg" className="py-12 md:py-20">
        <EstateContainer variant="visual">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase text-[var(--soe-surface-accent-metal)]">
                PRIVATE FARMHOUSE · SECTOR 135, NOIDA
              </p>
              <EstateHeading as="h1" variant="hero" className="text-[var(--soe-surface-text-primary)]">
                A Private Escape for Stays, Gatherings and Celebrations
              </EstateHeading>
              <EstateText variant="lg" className="text-[var(--soe-surface-text-secondary)]">
                Silver Oak Estate is a private farmhouse retreat in Sector 135, Noida,
                created for relaxed stays, family gatherings, corporate retreats and
                private celebrations.
              </EstateText>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <EstateActionLink variant="button" href="/availability">
                  Check Availability
                </EstateActionLink>
                <EstateActionLink
                  variant="editorial"
                  href="/estate"
                  className="text-[var(--soe-surface-text-primary)]"
                >
                  Discover the Estate →
                </EstateActionLink>
              </div>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape" className="w-full">
                <Image
                  src="/images/estate/home/hero-estate-exterior.webp"
                  alt="Exterior view of Silver Oak Estate private farmhouse in Sector 135, Noida"
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

      {/* B. EDITORIAL INTRODUCTION */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase text-[var(--soe-color-brand)]">
                THE ESTATE EXPERIENCE
              </p>
              <EstateHeading as="h2" variant="h2">
                A Private Estate, Made for Time Together
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                Set across sprawling grounds in Sector 135, Noida, Silver Oak Estate offers an exclusive property booking experience. Featuring a fully furnished 3 BHK residence with three themed king-bed bedrooms, an adult-size party pool, a lush private lawn, an indoor gathering space, a modular kitchen, and a dedicated dining area.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Designed for complete privacy, comfort, and peaceful surroundings, the estate accommodates {capacity.overnightLabel.toLowerCase()} or {capacity.standardDayEventLabel.toLowerCase()} for daytime events and gatherings.
              </EstateText>
              <div className="pt-2">
                <EstateActionLink variant="editorial" href="/estate">
                  Explore the Estate →
                </EstateActionLink>
              </div>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/home/estate-lawn.webp"
                  alt="Spacious private lawn and grounds at Silver Oak Estate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* C. STAY AND CELEBRATE PATHS */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <EstateHeading as="h2" variant="h2">
              Tailored to Your Occasion
            </EstateHeading>
            <EstateText variant="base" tone="muted" className="mt-3">
              Whether reserving the property for a quiet overnight stay or hosting an approved private event, Silver Oak Estate adapts to your needs.
            </EstateText>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[var(--soe-radius-card)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase text-[var(--soe-color-brand)]">
                  OVERNIGHT RESERVATIONS
                </p>
                <EstateHeading as="h3" variant="h3">
                  Stay
                </EstateHeading>
                <EstateText variant="base" tone="muted">
                  A private setting for relaxed overnight stays with family, friends and small groups.
                </EstateText>
              </div>
              <div>
                <EstateActionLink variant="button" href="/book">
                  Plan Your Stay
                </EstateActionLink>
              </div>
            </div>

            <div className="p-8 rounded-[var(--soe-radius-card)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase text-[var(--soe-color-brand)]">
                  DAYTIME & SPECIAL OCCASIONS
                </p>
                <EstateHeading as="h3" variant="h3">
                  Celebrate
                </EstateHeading>
                <EstateText variant="base" tone="muted">
                  A flexible setting for private gatherings, birthdays, celebrations, corporate retreats and approved events.
                </EstateText>
              </div>
              <div>
                <EstateActionLink variant="button" href="/contact">
                  Plan an Event
                </EstateActionLink>
              </div>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* D. PROPERTY MOMENTS */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <EstateHeading as="h2" variant="h2">
                Property Moments
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="mt-2">
                A glimpse inside the grounds, living spaces, and poolside atmosphere.
              </EstateText>
            </div>
            <div>
              <EstateActionLink variant="editorial" href="/gallery">
                View the Gallery →
              </EstateActionLink>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EstateMediaFrame aspectRatio="square">
              <Image
                src="/images/estate/home/estate-pool.webp"
                alt="Outdoor party pool at Silver Oak Estate"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </EstateMediaFrame>
            <EstateMediaFrame aspectRatio="square">
              <Image
                src="/images/estate/home/estate-interior.webp"
                alt="Furnished indoor living area with comfortable seating"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </EstateMediaFrame>
            <EstateMediaFrame aspectRatio="square">
              <Image
                src="/images/estate/home/estate-bedroom.webp"
                alt="Bedroom with a king bed at Silver Oak Estate"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </EstateMediaFrame>
            <EstateMediaFrame aspectRatio="square">
              <Image
                src="/images/estate/home/estate-evening.webp"
                alt="Illuminated evening view of Silver Oak Estate deck and building"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </EstateMediaFrame>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* E. PRICING PREVIEW */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="p-8 md:p-12 rounded-[var(--soe-radius-card)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase text-[var(--soe-color-brand)]">
                  CURRENT RATES
                </p>
                <EstateHeading as="h2" variant="h2">
                  Published Rates
                </EstateHeading>
                <EstateText variant="base" tone="muted">
                  Current weekday and weekend rates for the {booking.durationLabel}.
                </EstateText>
                <div>
                  <EstateActionLink variant="editorial" href="/pricing">
                    View Pricing →
                  </EstateActionLink>
                </div>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="isolate p-4 sm:p-6 rounded-[var(--soe-radius-control)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-medium text-[var(--soe-surface-text-secondary)] uppercase">
                    Weekday
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-lg)] sm:text-[length:var(--soe-text-xl)] font-bold text-[var(--soe-surface-text-primary)] mt-1">
                    {weekdayRate}
                  </p>
                  <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] mt-1">
                    for {booking.durationLabel}
                  </p>
                </div>
                <div className="isolate p-4 sm:p-6 rounded-[var(--soe-radius-control)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-medium text-[var(--soe-surface-text-secondary)] uppercase">
                    Weekend
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-lg)] sm:text-[length:var(--soe-text-xl)] font-bold text-[var(--soe-surface-text-primary)] mt-1">
                    {weekendRate}
                  </p>
                  <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] mt-1">
                    for {booking.durationLabel}
                  </p>
                </div>
                <div className="isolate p-4 sm:p-6 rounded-[var(--soe-radius-control)] bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-medium text-[var(--soe-surface-text-secondary)] uppercase">
                    Booking Advance
                  </p>
                  <p className="font-soe-display text-[length:var(--soe-text-lg)] sm:text-[length:var(--soe-text-xl)] font-bold text-[var(--soe-surface-text-primary)] mt-1">
                    {advanceAmount}
                  </p>
                  <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] mt-1">
                    to lock dates
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] mt-8 pt-6 border-t border-[var(--soe-surface-control-border)]/15">
              Final pricing, inclusions and any applicable charges will be confirmed in writing before payment and booking confirmation.
            </p>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* F. LOCATION */}
      <EstateSection surface="light" spacing="md">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase text-[var(--soe-color-brand)]">
                LOCATION
              </p>
              <EstateHeading as="h2" variant="h2">
                A Private Retreat in Noida
              </EstateHeading>
              <EstateText variant="base" tone="muted">
                Silver Oak Estate is located at Green Beauty Farms in Sector 135, Noida, with convenient access from Noida and Delhi NCR.
              </EstateText>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <EstateActionLink variant="editorial" href="/location">
                Explore the Location →
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* G. FINAL CONTACT SECTION */}
      <EstateSection surface="dark" spacing="lg" className="py-16 md:py-24 text-center">
        <EstateContainer variant="reading">
          <div className="space-y-6">
            <EstateHeading as="h2" variant="h2" className="text-[var(--soe-surface-text-primary)]">
              Plan Your Time at Silver Oak Estate
            </EstateHeading>
            <EstateText variant="lg" className="text-[var(--soe-surface-text-secondary)]">
              For availability, stays, events and private enquiries, contact the estate team by email or begin through the booking pages.
            </EstateText>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <EstateActionLink variant="button" href="/availability">
                Check Availability
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
