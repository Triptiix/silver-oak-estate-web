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

export const metadata: Metadata = {
  title: "The Estate | Silver Oak Estate Private Farmhouse in Noida",
  description:
    "Explore the fully furnished 3 BHK residence, lawn, pool, kitchen and private gathering spaces at Silver Oak Estate in Sector 135, Noida.",
};

const factRows = [
  ["Residence", "Fully furnished 3 BHK"],
  ["Bedrooms", "Three themed king-bed bedrooms"],
  ["Baths & changing", "Three attached bathrooms, one lawn bathroom, and pool changing room"],
  ["Grounds", "Private lawn, party pool and poolside deck"],
  ["Booking period", publicInformation.booking.durationLabel],
] as const;

const amenityGroups = [
  {
    title: "Comfort",
    details: [
      "Air conditioning in bedrooms, hall, kitchen and dining area",
      "Wi-Fi",
      "RO drinking water",
      "Toiletries",
    ],
  },
  {
    title: "Power & operational support",
    details: [
      "Diesel generator backup",
      "Solar power support",
      "Emergency lighting",
    ],
  },
  {
    title: "Security & caretaker",
    details: ["24/7 caretaker presence", "CCTV security"],
  },
  {
    title: "Parking & access",
    details: [
      `${publicInformation.parking.inside.valueLabel} inside the property`,
      `${publicInformation.parking.outside.valueLabel} outside the property`,
      "Green Beauty Farms, Sector 135, Noida",
    ],
  },
] as const;

export default function EstatePage() {
  const { capacity, contact, parking } = publicInformation;

  return (
    <div className="overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection surface="dark" spacing="none" className="border-b border-[var(--soe-color-gold)]/45">
        <div className="grid min-h-[calc(100svh-var(--header-height))] lg:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex items-center px-4 py-14 sm:px-8 lg:pl-[max(3rem,calc((100vw-var(--soe-container-visual))/2+2rem))] lg:pr-12">
            <div className="max-w-[37rem]">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">The estate · Sector 135, Noida</EstateEyebrow>
              <EstateHeading as="h1" variant="hero" className="text-[var(--soe-surface-text-primary)]" style={{ fontSize: "clamp(3rem, 5vw, 6.25rem)" }}>
                A Complete Private Estate for Time Together
              </EstateHeading>
              <EstateText variant="lg" className="mt-7 max-w-[33rem] text-[var(--soe-surface-text-secondary)]">
                Silver Oak Estate is a fully furnished 3 BHK farmhouse for private stays, family time, small-group retreats and approved gatherings.
              </EstateText>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <EstateActionLink variant="button" href="/availability">Check Availability</EstateActionLink>
                <EstateActionLink variant="button" href="/gallery" className="border border-[var(--soe-color-gold)] bg-transparent text-[var(--soe-surface-text-primary)] hover:bg-white/10">View the Gallery</EstateActionLink>
              </div>
            </div>
          </div>
          <div className="relative min-h-[45svh] overflow-hidden lg:min-h-full">
            <Image src="/images/estate/estate/estate-hero.webp" alt="Exterior view of Silver Oak Estate residence and private grounds in Sector 135, Noida" fill priority sizes="(max-width: 1023px) 100vw, 60vw" className="object-cover" />
          </div>
        </div>
      </EstateSection>

      <EstateSection surface="light" spacing="md" aria-labelledby="estate-facts-heading">
        <EstateContainer variant="visual">
          <div className="grid border-y border-[var(--soe-color-gold)]/50 md:grid-cols-2">
            <div className="border-b border-[var(--soe-color-gold)]/35 px-5 py-7 md:border-b-0 md:border-r lg:px-10">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">Residence details</EstateEyebrow>
              <EstateHeading id="estate-facts-heading" as="h2" variant="h2" className="mt-3">The Estate at a Glance</EstateHeading>
              <EstateText tone="muted" className="mt-5 max-w-xl">One complete property, thoughtfully arranged for private time together rather than independent room bookings.</EstateText>
            </div>
            <dl className="divide-y divide-[var(--soe-color-gold)]/35">
              {factRows.map(([term, definition]) => <div key={term} className="grid gap-2 px-5 py-5 sm:grid-cols-[10rem_1fr] lg:px-10"><dt className="font-soe-ui text-sm font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-brand)]">{term}</dt><dd className="font-soe-display text-[length:var(--soe-text-lg)] text-[var(--soe-surface-text-primary)]">{definition}</dd></div>)}
            </dl>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="light" spacing="lg" aria-labelledby="residence-heading">
        <EstateContainer variant="visual">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7"><EstateMediaFrame aspectRatio="landscape" className="min-h-[25rem] lg:min-h-[41rem]"><Image src="/images/estate/estate/estate-living-area.webp" alt="Indoor seating area with two chairs and a table at Silver Oak Estate" fill sizes="(max-width: 1023px) 100vw, 58vw" className="object-cover" /></EstateMediaFrame></div>
            <div className="flex flex-col justify-end lg:col-span-5"><EstateEyebrow className="text-[var(--soe-color-brand)]">Inside the residence</EstateEyebrow><EstateHeading id="residence-heading" as="h2" variant="h2" className="mt-3">Comfortable spaces for unhurried stays</EstateHeading><div className="my-6 h-px w-24 bg-[var(--soe-color-gold)]" /><EstateText tone="muted">The main residence features three themed king-bed bedrooms, each with air conditioning and direct access to an attached bathroom. Furnished indoor living and gathering areas provide room for conversation, relaxation and togetherness.</EstateText></div>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-[1.2fr_0.8fr] lg:ml-[8.333%] lg:max-w-5xl"><figure><EstateMediaFrame aspectRatio="landscape"><Image src="/images/estate/estate/estate-bedroom.webp" alt="Bedroom with a king bed at Silver Oak Estate" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 60vw, 44vw" className="object-cover" /></EstateMediaFrame><figcaption className="mt-3 font-soe-body text-sm text-[var(--soe-surface-text-secondary)]">King-bed bedrooms with air conditioning and comfortable furnishings.</figcaption></figure><figure className="sm:pt-14"><EstateMediaFrame aspectRatio="portrait"><Image src="/images/estate/estate/estate-bathroom.webp" alt="Clean attached bathroom at Silver Oak Estate" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 40vw, 30vw" className="object-cover" /></EstateMediaFrame><figcaption className="mt-3 font-soe-body text-sm text-[var(--soe-surface-text-secondary)]">Attached bathrooms with essential toiletries.</figcaption></figure></div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="light" spacing="lg" aria-labelledby="dining-heading">
        <EstateContainer variant="visual"><div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14"><div className="lg:col-span-5 lg:order-2"><EstateEyebrow className="text-[var(--soe-color-brand)]">Kitchen & dining</EstateEyebrow><EstateHeading id="dining-heading" as="h2" variant="h2" className="mt-3">A kitchen made for shared meals</EstateHeading><EstateText tone="muted" className="mt-6">The modular kitchen is set up for self-cooking and food preparation with a stove, induction cooktop, oven, utensils and general cooking equipment. Filtered RO drinking water is provided.</EstateText><EstateText tone="muted" className="mt-4">An adjoining dining area offers seating for 5, while outdoor BBQ equipment is available for open-air grilling.</EstateText></div><div className="grid gap-6 sm:grid-cols-[1.5fr_0.8fr] lg:col-span-7 lg:order-1"><EstateMediaFrame aspectRatio="landscape"><Image src="/images/estate/estate/estate-kitchen.webp" alt="Modular kitchen equipped with stove, induction and oven" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 60vw, 40vw" className="object-cover" /></EstateMediaFrame><EstateMediaFrame aspectRatio="portrait" className="sm:mt-12"><Image src="/images/estate/estate/estate-dining.webp" alt="Dedicated dining table and seating area" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 40vw, 28vw" className="object-cover" /></EstateMediaFrame></div></div></EstateContainer>
      </EstateSection>

      <EstateSection surface="dark" spacing="lg" aria-labelledby="outdoors-heading">
        <EstateContainer variant="visual"><div className="grid gap-8 lg:grid-cols-12 lg:gap-14"><div className="lg:col-span-5"><EstateEyebrow className="text-[var(--soe-surface-accent-metal)]">Lawn, pool & evening</EstateEyebrow><EstateHeading id="outdoors-heading" as="h2" variant="h2" className="mt-3 text-[var(--soe-surface-text-primary)]">Open-air time from lawn to poolside</EstateHeading><EstateText className="mt-6 text-[var(--soe-surface-text-secondary)]">Enjoy the private lawn and adult-size party pool during the standard booking period. Pool access is subject to operational availability, maintenance and caretaker instructions. A pool changing room and separate lawn bathroom are provided.</EstateText><EstateText className="mt-4 text-[var(--soe-surface-text-secondary)]">Outdoor amenities include a projector screen, speaker, board games and BBQ equipment for evenings together.</EstateText></div><div className="grid gap-6 lg:col-span-7"><EstateMediaFrame aspectRatio="cinema"><Image src="/images/estate/estate/estate-pool-deck.webp" alt="Adult-size party pool and deck at Silver Oak Estate" fill sizes="(max-width: 1023px) 100vw, 58vw" className="object-cover" /></EstateMediaFrame><EstateMediaFrame aspectRatio="landscape" className="lg:ml-auto lg:w-4/5"><Image src="/images/estate/estate/estate-lawn-evening.webp" alt="Evening view of the private lawn and grounds at Silver Oak Estate" fill sizes="(max-width: 1023px) 100vw, 46vw" className="object-cover" /></EstateMediaFrame></div></div></EstateContainer>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="operations-heading"
      >
        <EstateContainer variant="visual">
          <div className="grid gap-10 border-y border-[var(--soe-color-gold)]/45 py-8 lg:grid-cols-12 lg:py-12">
            <div className="lg:col-span-4">
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Amenities & operations
              </EstateEyebrow>
              <EstateHeading
                id="operations-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                Prepared for a comfortable private booking
              </EstateHeading>
            </div>
            <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:col-span-8">
              {amenityGroups.map((group) => (
                <section key={group.title}>
                  <EstateHeading
                    as="h3"
                    variant="h4"
                    className="text-[var(--soe-color-brand)]"
                  >
                    {group.title}
                  </EstateHeading>
                  <ul className="mt-4 space-y-2 border-l border-[var(--soe-color-gold)]/60 pl-4 font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
                    {group.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="light" spacing="lg" aria-labelledby="capacity-heading"><EstateContainer variant="content"><EstateEyebrow className="text-[var(--soe-color-brand)]">Guest capacity</EstateEyebrow><EstateHeading id="capacity-heading" as="h2" variant="h2" className="mt-3">Designed around your group</EstateHeading><div className="mt-8 grid border border-[var(--soe-color-gold)]/45 sm:grid-cols-3">{[["Overnight stays", capacity.overnightLabel], ["Indoor gatherings", capacity.indoorLabel], ["Standard daytime events", capacity.standardDayEventLabel]].map(([label, value]) => <div key={label} className="border-b border-[var(--soe-color-gold)]/35 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-brand)]">{label}</p><p className="mt-2 font-soe-display text-[length:var(--soe-text-xl)]">{value}</p></div>)}</div><p className="mt-5 max-w-3xl font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">{capacity.largerEventStatement} Final guest count, event requirements and permitted arrangements must be confirmed with the estate team before booking.</p></EstateContainer></EstateSection>

      <EstateSection surface="dark" spacing="lg"><EstateContainer variant="reading"><div className="space-y-6 text-center"><EstateHeading as="h2" variant="h2" className="text-[var(--soe-surface-text-primary)]">Reserve the estate for your time together</EstateHeading><EstateText variant="lg" className="text-[var(--soe-surface-text-secondary)]">Check availability for a private stay or contact the estate team to discuss an approved gathering or event.</EstateText><div className="flex flex-wrap justify-center gap-4"><EstateActionLink variant="button" href="/availability">Check Availability</EstateActionLink><EstateActionLink href="/contact" className="text-[var(--soe-surface-text-primary)]">Plan an Event</EstateActionLink><EstateActionLink href={contact.mailtoHref} className="text-[var(--soe-surface-text-primary)]">Email the Estate</EstateActionLink></div><p className="font-soe-body text-sm text-[var(--soe-surface-text-secondary)]">{parking.summary}</p></div></EstateContainer></EstateSection>
    </div>
  );
}
