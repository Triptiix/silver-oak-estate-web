import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "Silver Oak Estate | Private Farmhouse Stay & Event Venue in Noida",
  description:
    "Discover Silver Oak Estate, a private farmhouse in Sector 135, Noida for stays, family gatherings, corporate retreats and private celebrations.",
};

const focusClasses =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--soe-color-focus-offset)]";

export default function HomePage() {
  const { booking, capacity, contact } = publicInformation;
  const weekdayRate = formatInrFromPaise(booking.weekday.ratePaise);
  const weekendRate = formatInrFromPaise(booking.weekend.ratePaise);
  const advanceAmount = formatInrFromPaise(booking.advancePaise);

  const facts = [
    "Private 3 BHK estate",
    "Sector 135, Noida",
    `${capacity.overnightLabel} overnight`,
    `${capacity.standardDayEventLabel} for daytime events`,
    "Pool, lawn and indoor space",
    "Complete-property reservation",
  ];

  return (
    <div className="flex flex-col overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection
        surface="dark"
        spacing="none"
        aria-labelledby="home-hero-heading"
        className="border-b border-[var(--soe-color-gold)]/45"
      >
        <div className="grid min-h-[calc(100svh-var(--header-height))] lg:grid-cols-[minmax(22rem,0.88fr)_minmax(0,1.12fr)]">
          <div className="relative z-10 flex items-center px-4 py-12 sm:px-8 md:py-16 lg:py-20 lg:pl-[max(3rem,calc((100vw-var(--soe-container-visual))/2+2rem))] lg:pr-12">
            <div className="max-w-[38rem]">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">
                Private farmhouse · Sector 135, Noida
              </EstateEyebrow>
              <EstateHeading
                id="home-hero-heading"
                as="h1"
                variant="hero"
                className="text-[var(--soe-surface-text-primary)]"
                style={{
                  fontSize: "clamp(3rem, 4.1vw, 5rem)",
                  lineHeight: 1,
                }}
              >
                A Private Escape for Stays, Gatherings and Celebrations
              </EstateHeading>
              <EstateText
                variant="lg"
                className="mt-7 max-w-[34rem] text-[var(--soe-surface-text-secondary)]"
              >
                Silver Oak Estate is a private farmhouse retreat in Sector 135,
                Noida, created for relaxed stays, family gatherings, corporate
                retreats and private celebrations.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <EstateActionLink variant="button" href="/availability">
                  Check Availability
                </EstateActionLink>
                <EstateActionLink
                  variant="button"
                  href="/estate"
                  className="border border-[var(--soe-color-gold)] bg-transparent text-[var(--soe-surface-text-primary)] hover:bg-white/10"
                >
                  Discover the Estate
                </EstateActionLink>
              </div>
            </div>
          </div>

          <div className="relative min-h-[45svh] overflow-hidden lg:min-h-full">
            <Image
              src="/images/estate/home/hero-estate-exterior.webp"
              alt="Exterior view of Silver Oak Estate private farmhouse in Sector 135, Noida"
              fill
              sizes="(max-width: 1023px) 100vw, 64vw"
              priority
              className="object-cover transition-transform duration-[var(--soe-duration-editorial)] motion-reduce:transition-none lg:scale-[1.01]"
            />
          </div>
        </div>

        <EstateContainer variant="visual">
          <ul
            aria-label="Essential estate facts"
            className="grid border-y border-[var(--soe-color-gold)]/45 py-2 sm:grid-cols-2 lg:grid-cols-6"
          >
            {facts.map((fact) => (
              <li
                key={fact}
                className="flex min-h-16 items-center border-b border-[var(--soe-color-gold)]/25 px-4 py-3 font-soe-display text-[length:var(--soe-text-base)] text-[var(--soe-surface-text-primary)] last:border-b-0 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                {fact}
              </li>
            ))}
          </ul>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="estate-story-heading"
        className="overflow-hidden"
      >
        <EstateContainer variant="visual">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="relative min-h-[24rem] overflow-hidden rounded-[var(--soe-radius-media)] sm:min-h-[34rem] lg:col-span-7 lg:min-h-[44rem]">
              <Image
                src="/images/estate/home/estate-lawn.webp"
                alt="Spacious private lawn and grounds at Silver Oak Estate"
                fill
                sizes="(max-width: 1023px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
            <div className="lg:col-span-5 lg:max-w-[31rem]">
              <EstateEyebrow className="mb-5 text-[var(--soe-color-brand)]">
                The estate experience
              </EstateEyebrow>
              <EstateHeading id="estate-story-heading" as="h2" variant="h2">
                A Private Estate, Made for Time Together
              </EstateHeading>
              <div className="my-7 h-px w-24 bg-[var(--soe-color-gold)]" />
              <EstateText variant="base" tone="muted">
                Set across green grounds in Sector 135, Noida, Silver Oak Estate
                is reserved as one complete property. The fully furnished 3 BHK
                residence is accompanied by a pool, private lawn and indoor
                gathering space.
              </EstateText>
              <EstateText variant="base" tone="muted" className="mt-5">
                The estate welcomes {capacity.overnightLabel.toLowerCase()} or{" "}
                {capacity.standardDayEventLabel.toLowerCase()} for standard
                daytime events. Larger events require prior written approval
                after an operational and safety review.
              </EstateText>
              <EstateActionLink
                variant="editorial"
                href="/estate"
                className="mt-8"
              >
                Explore the Estate
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="none"
        aria-labelledby="occasion-heading"
        className="pb-[var(--soe-section-space-lg)]"
      >
        <EstateContainer variant="visual">
          <div className="mb-10 max-w-2xl">
            <EstateEyebrow className="mb-4 text-[var(--soe-color-brand)]">
              Stay and celebrate
            </EstateEyebrow>
            <EstateHeading id="occasion-heading" as="h2" variant="h2">
              Two Ways to Spend Time at the Estate
            </EstateHeading>
          </div>

          <div className="grid gap-px overflow-hidden border border-[var(--soe-color-gold)]/35 bg-[var(--soe-color-gold)]/35 lg:grid-cols-2">
            <Link
              href="/book"
              className={`group relative min-h-[32rem] overflow-hidden bg-[var(--soe-color-night)] sm:min-h-[40rem] ${focusClasses}`}
            >
              <Image
                src="/images/estate/home/estate-bedroom.webp"
                alt="Bedroom with a king bed at Silver Oak Estate"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover transition-transform duration-[var(--soe-duration-editorial)] ease-[var(--soe-ease-editorial)] group-hover:scale-[1.025] motion-reduce:transition-none"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(13,15,14,0.95),rgba(13,15,14,0))] px-6 pb-8 pt-28 sm:px-10 sm:pb-10">
                <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-gold)]">
                  Overnight reservations
                </p>
                <EstateHeading
                  as="h3"
                  variant="h2"
                  className="mt-2 text-[var(--soe-color-canvas)]"
                >
                  Stay
                </EstateHeading>
                <p className="mt-3 max-w-md font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-color-silver)]">
                  A private setting for relaxed overnight stays with family,
                  friends and small groups.
                </p>
                <span className="mt-6 inline-flex min-h-11 items-center border-b border-[var(--soe-color-gold)] font-soe-display text-[length:var(--soe-text-lg)] text-[var(--soe-color-canvas)]">
                  Plan Your Stay
                </span>
              </div>
            </Link>

            <Link
              href="/contact"
              className={`group relative min-h-[32rem] overflow-hidden bg-[var(--soe-color-night)] sm:min-h-[40rem] ${focusClasses}`}
            >
              <Image
                src="/images/estate/home/estate-pool.webp"
                alt="Outdoor party pool at Silver Oak Estate"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover transition-transform duration-[var(--soe-duration-editorial)] ease-[var(--soe-ease-editorial)] group-hover:scale-[1.025] motion-reduce:transition-none"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(13,15,14,0.95),rgba(13,15,14,0))] px-6 pb-8 pt-28 sm:px-10 sm:pb-10">
                <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-gold)]">
                  Private events and gatherings
                </p>
                <EstateHeading
                  as="h3"
                  variant="h2"
                  className="mt-2 text-[var(--soe-color-canvas)]"
                >
                  Celebrate
                </EstateHeading>
                <p className="mt-3 max-w-md font-soe-body leading-[var(--soe-leading-body)] text-[var(--soe-color-silver)]">
                  A flexible setting for approved private gatherings,
                  celebrations and corporate retreats.
                </p>
                <span className="mt-6 inline-flex min-h-11 items-center border-b border-[var(--soe-color-gold)] font-soe-display text-[length:var(--soe-text-lg)] text-[var(--soe-color-canvas)]">
                  Plan an Event
                </span>
              </div>
            </Link>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="gallery-heading"
        className="border-y border-[var(--soe-color-gold)]/25 bg-[var(--soe-color-surface)]"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-3">
              <EstateEyebrow className="mb-4 text-[var(--soe-color-brand)]">
                Silver Oak Estate
              </EstateEyebrow>
              <EstateHeading id="gallery-heading" as="h2" variant="h2">
                Property Moments
              </EstateHeading>
              <EstateText variant="base" tone="muted" className="mt-5">
                A glimpse inside the grounds, living spaces and evening
                atmosphere.
              </EstateText>
              <EstateActionLink
                variant="editorial"
                href="/gallery"
                className="mt-7"
              >
                View the Gallery
              </EstateActionLink>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5 lg:grid-rows-2">
              <div className="relative min-h-72 overflow-hidden rounded-[var(--soe-radius-media)] sm:col-span-2 lg:col-span-3 lg:row-span-2 lg:min-h-[42rem]">
                <Image
                  src="/images/estate/home/estate-evening.webp"
                  alt="Illuminated evening view of Silver Oak Estate deck and building"
                  fill
                  sizes="(max-width: 1023px) 100vw, 54vw"
                  className="object-cover"
                />
              </div>
              <div className="relative min-h-60 overflow-hidden rounded-[var(--soe-radius-media)] lg:col-span-2">
                <Image
                  src="/images/estate/home/estate-interior.webp"
                  alt="Furnished indoor living area with comfortable seating"
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="relative min-h-60 overflow-hidden rounded-[var(--soe-radius-media)] lg:col-span-2">
                <Image
                  src="/images/estate/home/estate-bedroom.webp"
                  alt="Bedroom with a king bed at Silver Oak Estate"
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="pricing-heading"
      >
        <EstateContainer variant="visual">
          <div className="border-y border-[var(--soe-color-gold)] py-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:divide-x lg:divide-[var(--soe-color-gold)]/45">
              <div className="lg:pr-10">
                <EstateEyebrow className="mb-4 text-[var(--soe-color-brand)]">
                  CURRENT RATES
                </EstateEyebrow>
                <EstateHeading id="pricing-heading" as="h2" variant="h3">
                  Published Rates for the Complete Estate
                </EstateHeading>
                <EstateText variant="sm" tone="muted" className="mt-4">
                  Current rates for the {booking.durationLabel}.
                </EstateText>
                <EstateActionLink
                  variant="editorial"
                  href="/pricing"
                  className="mt-6"
                >
                  View Pricing
                </EstateActionLink>
              </div>
              {[
                ["Weekday", weekdayRate],
                ["Weekend", weekendRate],
                ["Booking advance", advanceAmount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border-t border-[var(--soe-color-gold)]/35 pt-6 lg:border-t-0 lg:px-8 lg:pt-0"
                >
                  <p className="font-soe-ui text-[length:var(--soe-text-sm)] text-[var(--soe-color-ink-muted)]">
                    {label}
                  </p>
                  <p className="mt-3 font-soe-display text-[clamp(2.25rem,4vw,4.5rem)] leading-none text-[var(--soe-color-brand-strong)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-10 border-t border-[var(--soe-color-gold)]/35 pt-6 text-center font-soe-body text-[length:var(--soe-text-sm)] text-[var(--soe-color-ink-muted)]">
              Final pricing, inclusions and any applicable charges will be
              confirmed in writing before payment and booking confirmation.
            </p>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="none"
        aria-labelledby="location-heading"
      >
        <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
          <div className="flex items-center px-4 py-14 sm:px-8 lg:px-[max(3rem,calc((100vw-var(--soe-container-visual))/2+2rem))] lg:py-20">
            <div className="max-w-lg">
              <EstateEyebrow className="mb-5 text-[var(--soe-color-brand)]">
                Location
              </EstateEyebrow>
              <EstateHeading id="location-heading" as="h2" variant="h2">
                A Private Retreat in Noida
              </EstateHeading>
              <div className="my-7 h-px w-24 bg-[var(--soe-color-gold)]" />
              <EstateText variant="base" tone="muted">
                Green Beauty Farms, Sector 135, Noida
              </EstateText>
              <EstateActionLink
                variant="button"
                href="/location"
                className="mt-8"
              >
                Explore the Location
              </EstateActionLink>
            </div>
          </div>
          <div className="relative min-h-[24rem] overflow-hidden sm:min-h-[34rem]">
            <Image
              src="/images/estate/home/estate-lawn.webp"
              alt="Green lawn and private farmhouse grounds at Silver Oak Estate in Noida"
              fill
              sizes="(max-width: 1023px) 100vw, 62vw"
              className="object-cover"
            />
          </div>
        </div>
      </EstateSection>

      <EstateSection
        surface="dark"
        spacing="none"
        aria-labelledby="final-enquiry-heading"
        className="border-t border-[var(--soe-color-gold)]/45"
      >
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[26rem] overflow-hidden lg:min-h-[38rem]">
            <Image
              src="/images/estate/home/estate-evening.webp"
              alt="Silver Oak Estate illuminated for the evening"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex items-center px-4 py-14 sm:px-8 lg:px-16 lg:py-20">
            <div className="max-w-xl">
              <EstateHeading
                id="final-enquiry-heading"
                as="h2"
                variant="h2"
                className="text-[var(--soe-surface-text-primary)]"
              >
                Plan Your Time at Silver Oak Estate
              </EstateHeading>
              <div className="my-7 h-px w-24 bg-[var(--soe-color-gold)]" />
              <EstateText
                variant="lg"
                className="text-[var(--soe-surface-text-secondary)]"
              >
                For availability, private stays and approved events, contact the
                estate team or begin with the availability calendar.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <EstateActionLink variant="button" href="/availability">
                  Check Availability
                </EstateActionLink>
                <EstateActionLink
                  variant="button"
                  href={contact.mailtoHref}
                  className="border border-[var(--soe-color-gold)] bg-transparent text-[var(--soe-surface-text-primary)] hover:bg-white/10"
                >
                  Email the Estate
                </EstateActionLink>
              </div>
            </div>
          </div>
        </div>
      </EstateSection>
    </div>
  );
}
