import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateMediaFrame } from "@/components/estate-ui/estate-media-frame";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Experiences | Private Stays & Gatherings at Silver Oak Estate",
  description:
    "Discover private stays, approved gatherings, pool and lawn time at Silver Oak Estate in Sector 135, Noida. Fully furnished 3 BHK farmhouse for 6–10 overnight guests.",
};

export default function ExperiencesPage() {
  return (
    <div className="min-h-screen bg-[var(--soe-surface-bg-base)] text-[var(--soe-surface-text-primary)]">
      {/* A. EDITORIAL HERO */}
      <EstateSection surface="dark" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
                EXPERIENCES · SECTOR 135, NOIDA
              </EstateEyebrow>
              <EstateHeading as="h1" variant="hero">
                Experiences at Silver Oak Estate
              </EstateHeading>
              <EstateText variant="lg" tone="muted">
                From quiet family retreats to approved private gatherings, Silver Oak Estate provides a 3 BHK farmhouse with a private lawn, party pool, and self-cooking facilities in Sector 135, Noida.
              </EstateText>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <EstateActionLink href="/availability" variant="button">
                  Check Availability
                </EstateActionLink>
                <EstateActionLink href="/estate">
                  Explore the Estate
                </EstateActionLink>
              </div>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-hero.webp"
                  alt="Silver Oak Estate exterior daytime view showing private grounds"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* B. WAYS TO EXPERIENCE THE ESTATE */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <EstateEyebrow className="text-[var(--soe-color-brand)]">
              WAYS TO EXPERIENCE THE ESTATE
            </EstateEyebrow>
            <EstateHeading as="h2" variant="h2">
              Designed for Private Stays, Gatherings & Shared Evenings
            </EstateHeading>
            <EstateText variant="base" tone="muted">
              Whether relaxing overnight or hosting an approved private event, your group gets complete access to the entire 3 BHK residence and grounds.
            </EstateText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Stay & Unwind */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] overflow-hidden flex flex-col">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-stay.webp"
                  alt="Furnished bedroom at Silver Oak Estate for overnight stays"
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    OVERNIGHT STAYS
                  </p>
                  <EstateHeading as="h3" variant="h3">
                    Stay & Unwind
                  </EstateHeading>
                  <EstateText variant="sm" tone="muted">
                    Comfortable overnight accommodation for 6–10 guests across three themed king-bed bedrooms with attached bathrooms, air conditioning, Wi-Fi, and diesel generator power backup.
                  </EstateText>
                </div>
              </div>
            </div>

            {/* 2. Gather & Celebrate */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] overflow-hidden flex flex-col">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-gather.webp"
                  alt="Party pool and deck at Silver Oak Estate for private gatherings"
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    PRIVATE EVENTS
                  </p>
                  <EstateHeading as="h3" variant="h3">
                    Gather & Celebrate
                  </EstateHeading>
                  <EstateText variant="sm" tone="muted">
                    Approved private day gatherings for approximately 30–40 guests, utilizing the spacious open-air lawn, pool deck, and indoor seating for approximately 15–20 guests.
                  </EstateText>
                </div>
              </div>
            </div>

            {/* 3. Share Food & Evenings */}
            <div className="bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20 rounded-[var(--soe-radius-card)] overflow-hidden flex flex-col">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-dining.webp"
                  alt="Dedicated dining area at Silver Oak Estate"
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
                    FOOD & ENTERTAINMENT
                  </p>
                  <EstateHeading as="h3" variant="h3">
                    Share Food & Evenings
                  </EstateHeading>
                  <EstateText variant="sm" tone="muted">
                    Modular kitchen for self-cooking, dedicated dining seating for 5, outdoor BBQ equipment, outdoor projector screen, speaker, and board games for evening entertainment.
                  </EstateText>
                </div>
              </div>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* C. POOL, LAWN AND OPEN-AIR TIME */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                OUTDOOR & RECREATION
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Poolside, Lawn & Open-Air Recreation
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                Spend quality open-air time on the private lawn and around the adult-size party pool. Pool access is available throughout your booking period, supported by a pool changing room and separate lawn bathroom.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Evening recreation includes an outdoor projector screen, speaker, board games, and outdoor BBQ equipment for open-air grilling under the stars.
              </EstateText>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-pool-lawn.webp"
                  alt="Adult-size party pool deck at Silver Oak Estate"
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* D. PRIVATE STAYS */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-residence.webp"
                  alt="Comfortable indoor seating lounge at Silver Oak Estate"
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                ACCOMMODATION & COMFORT
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Restful Private Residence
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                The fully furnished 3 BHK residence accommodates 6–10 overnight guests with three themed king-bed bedrooms and three attached bathrooms.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Essential infrastructure includes Wi-Fi, air conditioning, filtered RO drinking water, diesel generator power backup, solar support, emergency lighting, CCTV security, and an on-site caretaker.
              </EstateText>
              <div>
                <EstateActionLink href="/estate">View the Estate</EstateActionLink>
              </div>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* E. APPROVED GATHERINGS */}
      <EstateSection surface="light" spacing="lg">
        <EstateContainer variant="content">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                GATHERINGS & ARRANGEMENTS
              </EstateEyebrow>
              <EstateHeading as="h2" variant="h2">
                Thoughtfully Hosted Private Events
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="space-y-4">
                Silver Oak Estate hosts approved private day gatherings for approximately 30–40 guests, with indoor gathering seating for approximately 15–20 guests in the hall and dining areas.
              </EstateText>
              <EstateText variant="base" tone="muted">
                Optional services such as catering, DJ, photography or shoots, and custom event arrangements are available on request, subject to availability and written confirmation on a case-by-case basis.
              </EstateText>
              <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] italic pt-2">
                “Optional services and event arrangements are available on request and will be confirmed in writing before payment and booking confirmation.”
              </p>
            </div>
            <div className="lg:col-span-6">
              <EstateMediaFrame aspectRatio="landscape">
                <Image
                  src="/images/estate/experiences/experiences-lawn-evening.webp"
                  alt="Night-time lawn lighting at Silver Oak Estate for evening gatherings"
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
              </EstateMediaFrame>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      {/* F. PLAN YOUR TIME HERE */}
      <EstateSection surface="dark" spacing="lg">
        <EstateContainer variant="content">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">
              PLAN YOUR VISIT
            </EstateEyebrow>
            <EstateHeading as="h2" variant="h2">
              Plan Your Experience at Silver Oak Estate
            </EstateHeading>
            <EstateText variant="lg" tone="muted">
              Check availability for your preferred dates or contact our team to discuss your gathering requirements.
            </EstateText>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <EstateActionLink href="/availability" variant="button">
                Check Availability
              </EstateActionLink>
              <EstateActionLink href="/gallery">
                View Gallery
              </EstateActionLink>
              <EstateActionLink href="mailto:contact@silveroakestate.online">
                Email an Enquiry
              </EstateActionLink>
            </div>
            <p className="text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)] italic pt-4 max-w-xl mx-auto">
              Optional services and event arrangements are available on request and will be confirmed in writing before payment and booking confirmation.
            </p>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
