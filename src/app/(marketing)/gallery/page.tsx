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

export const metadata: Metadata = buildPageMetadata({
  title: "Gallery",
  description: "Explore verified photographs of the residence, bedrooms, lawn, pool, living spaces and evening atmosphere at Silver Oak Estate in Sector 135, Noida.",
  path: "/gallery",
});

type GalleryImage = {
  src: string;
  alt: string;
  category: string;
  caption?: string;
  size: "wide" | "tall" | "standard";
};

// Ordered so the newest estate photography leads the grid, and so the
// wide/tall/standard sizes tile a three-column layout without leaving gaps.
const galleryImages: readonly GalleryImage[] = [
  { src: "/images/estate/home/estate-lawn.webp", alt: "Spacious private lawn and grounds at Silver Oak Estate", category: "Grounds", caption: "Private lawn", size: "wide" },
  { src: "/images/estate/experiences/deck-01.webp", alt: "Patterned poolside deck beside the residence, with the tiled pool and open fields beyond", category: "Pool", caption: "Poolside deck", size: "standard" },
  { src: "/images/estate/estate/estate-deck-03.webp", alt: "Elevated view of the geometric poolside deck, turquoise pool and hedged garden edge", category: "Pool", caption: "Deck and pool", size: "tall" },
  { src: "/images/estate/estate/estate-dining-03.webp", alt: "Six-seat wooden dining table with a stone top, cushioned chairs and sheer curtained windows", category: "Dining", caption: "Dining room", size: "standard" },
  { src: "/images/estate/estate/estate-bedroom-02.webp", alt: "Two views of a bedroom with a padded headboard, wardrobe, woven rug and window seating", category: "Bedrooms", caption: "Bedroom views", size: "standard" },
  { src: "/images/estate/estate/estate-kitchen.webp", alt: "Modular kitchen at Silver Oak Estate", category: "Kitchen", caption: "Self-cooking kitchen", size: "wide" },
  { src: "/images/estate/estate/estate-pool-deck.webp", alt: "Adult-size party pool and deck at Silver Oak Estate", category: "Pool", size: "wide" },
  { src: "/images/estate/estate/estate-bedroom-03.webp", alt: "Three views of a bedroom with an en-suite bathroom and a pair of red-cushioned chairs by the window", category: "Bedrooms", caption: "Bedroom and seating", size: "standard" },
  { src: "/images/estate/estate/estate-kitchen-03.webp", alt: "Open kitchen with a breakfast counter, bar stools, patterned tile splashback and rope pendant lighting", category: "Kitchen", caption: "Breakfast counter", size: "tall" },
  { src: "/images/estate/estate/estate-living-area.webp", alt: "Indoor seating area with two chairs and a table at Silver Oak Estate", category: "Residence", caption: "Living space", size: "standard" },
  { src: "/images/estate/estate/estate-dining.webp", alt: "Dedicated dining table and seating area at Silver Oak Estate", category: "Dining", size: "standard" },
  { src: "/images/estate/estate/estate-lawn-evening.webp", alt: "Evening view of the private lawn and grounds at Silver Oak Estate", category: "Evenings", caption: "Lawn at evening", size: "wide" },
];

const cellClasses = {
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  standard: "",
} as const;

export default function GalleryPage() {
  return (
    <div className="overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection surface="dark" spacing="none" className="border-b border-[var(--soe-color-gold)]/45">
        <div className="grid min-h-[calc(76svh-var(--header-height))] lg:grid-cols-[0.86fr_1.14fr]">
          <div className="soe-motion-fade-rise flex items-center px-4 py-14 sm:px-8 lg:pl-[max(3rem,calc((100vw-var(--soe-container-visual))/2+2rem))] lg:pr-12">
            <div className="max-w-[34rem]">
              <EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">
                Silver Oak Estate · Sector 135, Noida
              </EstateEyebrow>
              <EstateHeading as="h1" variant="hero" className="text-[var(--soe-surface-text-primary)]" style={{ fontSize: "clamp(3rem, 5vw, 6rem)" }}>
                A closer look at the estate
              </EstateHeading>
              <EstateText variant="lg" className="mt-7 text-[var(--soe-surface-text-secondary)]">
                A considered collection of verified views from the residence, bedrooms, kitchen, lawn, pool and evenings outdoors.
              </EstateText>
            </div>
          </div>
          <div className="soe-motion-image-reveal relative min-h-[42svh] overflow-hidden lg:min-h-full">
            <Image
              src="/images/estate/home/hero-estate-exterior.webp"
              alt="Exterior view of Silver Oak Estate private farmhouse in Sector 135, Noida"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 64vw"
              className="object-cover"
            />
          </div>
        </div>
      </EstateSection>

      <EstateSection
        surface="light"
        spacing="lg"
        aria-labelledby="gallery-grid-heading"
      >
        <EstateContainer variant="visual">
          <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[var(--soe-color-gold)]/45 pb-7 sm:flex-row sm:items-end">
            <div>
              <EstateEyebrow className="text-[var(--soe-color-brand)]">
                Estate photographs
              </EstateEyebrow>
              <EstateHeading
                id="gallery-grid-heading"
                as="h2"
                variant="h2"
                className="mt-3"
              >
                Residence, grounds and shared spaces
              </EstateHeading>
            </div>
            <p className="max-w-sm font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
              Every image reflects a space at the estate; final arrangements and
              inclusions are confirmed in writing.
            </p>
          </div>
          <div className="grid auto-rows-[14rem] gap-4 sm:auto-rows-[18rem] md:grid-cols-3 lg:auto-rows-[22rem]">
            {galleryImages.map((image) => {
              const sizes =
                image.size === "wide"
                  ? "(max-width: 767px) 100vw, (max-width: 1023px) 66vw, 64vw"
                  : "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 32vw";

              return (
                <figure
                  key={image.src}
                  className={`soe-motion-image-reveal group relative overflow-hidden rounded-[var(--soe-radius-media)] border border-[var(--soe-color-gold)]/35 bg-[var(--soe-color-stone)] ${cellClasses[image.size]}`}
                >
                  <EstateMediaFrame
                    aspectRatio="landscape"
                    className="aspect-auto h-full w-full rounded-none"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes={sizes}
                      className="object-cover"
                    />
                  </EstateMediaFrame>
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-[linear-gradient(to_top,rgba(13,15,14,0.85),transparent)] px-4 pb-4 pt-16 text-[var(--soe-color-canvas)]">
                    <span className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-gold)]">
                      {image.category}
                    </span>
                    {image.caption ? (
                      <span className="font-soe-display text-base">
                        {image.caption}
                      </span>
                    ) : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </EstateContainer>
      </EstateSection>

      <EstateSection surface="dark" spacing="lg">
        <EstateContainer variant="reading">
          <div className="text-center">
            <EstateHeading as="h2" variant="h2" className="text-[var(--soe-surface-text-primary)]">
              Continue your estate plan
            </EstateHeading>
            <EstateText variant="lg" className="mx-auto mt-5 max-w-2xl text-[var(--soe-surface-text-secondary)]">
              Check preferred dates for a private stay, explore the details of the residence or speak with the estate team about an approved event.
            </EstateText>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <EstateActionLink variant="button" href="/availability">
                Check Availability
              </EstateActionLink>
              <EstateActionLink href="/estate" className="text-[var(--soe-surface-text-primary)]">
                Explore the Estate
              </EstateActionLink>
              <EstateActionLink href="/contact" className="text-[var(--soe-surface-text-primary)]">
                Event Enquiry
              </EstateActionLink>
            </div>
          </div>
        </EstateContainer>
      </EstateSection>
    </div>
  );
}
