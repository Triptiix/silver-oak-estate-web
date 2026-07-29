import type { Metadata } from "next";
import Image from "next/image";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateMediaFrame } from "@/components/estate-ui/estate-media-frame";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateText } from "@/components/estate-ui/estate-text";

export const metadata: Metadata = {
  title: "Gallery | Silver Oak Estate",
  description:
    "Explore verified photographs of the residence, bedrooms, lawn, pool, living spaces and evening atmosphere at Silver Oak Estate in Sector 135, Noida.",
};

type GalleryImage = {
  src: string;
  alt: string;
  category: string;
  caption?: string;
  size: "wide" | "tall" | "standard";
};

const galleryImages: readonly GalleryImage[] = [
  { src: "/images/estate/home/estate-lawn.webp", alt: "Spacious private lawn and grounds at Silver Oak Estate", category: "Grounds", caption: "Private lawn", size: "wide" },
  { src: "/images/estate/estate/estate-living-area.webp", alt: "Indoor seating area with two chairs and a table at Silver Oak Estate", category: "Residence", caption: "Living space", size: "standard" },
  { src: "/images/estate/estate/estate-bedroom.webp", alt: "Bedroom with a king bed at Silver Oak Estate", category: "Bedrooms", caption: "King-bed bedroom", size: "tall" },
  { src: "/images/estate/estate/estate-bathroom.webp", alt: "Clean attached bathroom at Silver Oak Estate", category: "Residence", size: "standard" },
  { src: "/images/estate/estate/estate-kitchen.webp", alt: "Modular kitchen at Silver Oak Estate", category: "Kitchen", caption: "Self-cooking kitchen", size: "wide" },
  { src: "/images/estate/estate/estate-dining.webp", alt: "Dedicated dining table and seating area at Silver Oak Estate", category: "Dining", size: "standard" },
  { src: "/images/estate/estate/estate-pool-deck.webp", alt: "Adult-size party pool and deck at Silver Oak Estate", category: "Pool", caption: "Poolside deck", size: "wide" },
  { src: "/images/estate/estate/estate-lawn-evening.webp", alt: "Evening view of the private lawn and grounds at Silver Oak Estate", category: "Evenings", caption: "Lawn at evening", size: "tall" },
  { src: "/images/estate/experiences/experiences-dining.webp", alt: "Dedicated dining area prepared for shared meals at Silver Oak Estate", category: "Dining", size: "standard" },
  { src: "/images/estate/experiences/experiences-pool-lawn.webp", alt: "Pool deck and lawn at Silver Oak Estate", category: "Grounds", size: "standard" },
];

const cellClasses = {
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  standard: "",
} as const;

const aspectRatios = {
  wide: "landscape",
  tall: "portrait",
  standard: "landscape",
} as const;

export default function GalleryPage() {
  return (
    <div className="overflow-x-clip bg-[var(--soe-color-canvas)]">
      <EstateSection surface="dark" spacing="none" className="border-b border-[var(--soe-color-gold)]/45">
        <div className="grid min-h-[calc(76svh-var(--header-height))] lg:grid-cols-[0.86fr_1.14fr]">
          <div className="flex items-center px-4 py-14 sm:px-8 lg:pl-[max(3rem,calc((100vw-var(--soe-container-visual))/2+2rem))] lg:pr-12"><div className="max-w-[34rem]"><EstateEyebrow className="mb-6 text-[var(--soe-surface-accent-metal)]">Silver Oak Estate · Sector 135, Noida</EstateEyebrow><EstateHeading as="h1" variant="hero" className="text-[var(--soe-surface-text-primary)]" style={{ fontSize: "clamp(3rem, 5vw, 6rem)" }}>A closer look at the estate</EstateHeading><EstateText variant="lg" className="mt-7 text-[var(--soe-surface-text-secondary)]">A considered collection of verified views from the residence, bedrooms, kitchen, lawn, pool and evenings outdoors.</EstateText></div></div>
          <div className="relative min-h-[42svh] overflow-hidden lg:min-h-full"><Image src="/images/estate/home/hero-estate-exterior.webp" alt="Exterior view of Silver Oak Estate private farmhouse in Sector 135, Noida" fill priority sizes="(max-width: 1023px) 100vw, 64vw" className="object-cover" /></div>
        </div>
      </EstateSection>

      <EstateSection surface="light" spacing="lg" aria-labelledby="gallery-grid-heading"><EstateContainer variant="visual"><div className="mb-10 flex flex-col justify-between gap-5 border-b border-[var(--soe-color-gold)]/45 pb-7 sm:flex-row sm:items-end"><div><EstateEyebrow className="text-[var(--soe-color-brand)]">Estate photographs</EstateEyebrow><EstateHeading id="gallery-grid-heading" as="h2" variant="h2" className="mt-3">Residence, grounds and shared spaces</EstateHeading></div><p className="max-w-sm font-soe-body text-sm leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">Every image reflects a space at the estate; final arrangements and inclusions are confirmed in writing.</p></div><div className="grid auto-rows-[14rem] gap-4 sm:auto-rows-[18rem] md:grid-cols-3 lg:auto-rows-[22rem]">{galleryImages.map((image) => <figure key={image.src} className={`group relative overflow-hidden bg-[var(--soe-color-stone)] ${cellClasses[image.size]}`}><EstateMediaFrame aspectRatio={aspectRatios[image.size]} className="h-full rounded-none"><Image src={image.src} alt={image.alt} fill sizes={image.size === "wide" ? "(max-width: 767px) 100vw, (max-width: 1023px) 66vw, 64vw" : image.size === "tall" ? "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 32vw" : "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 32vw"} className="object-cover transition-transform duration-[var(--soe-duration-editorial)] group-hover:scale-[1.02] motion-reduce:transition-none" /></EstateMediaFrame><figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-[linear-gradient(to_top,rgba(13,15,14,0.8),transparent)] px-4 pb-4 pt-16 text-[var(--soe-color-canvas)]"><span className="font-soe-ui text-xs font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)]">{image.category}</span>{image.caption ? <span className="font-soe-display text-base">{image.caption}</span> : null}</figcaption></figure>)}</div></EstateContainer></EstateSection>

      <EstateSection surface="dark" spacing="lg"><EstateContainer variant="reading"><div className="text-center"><EstateHeading as="h2" variant="h2" className="text-[var(--soe-surface-text-primary)]">Continue your estate plan</EstateHeading><EstateText variant="lg" className="mx-auto mt-5 max-w-2xl text-[var(--soe-surface-text-secondary)]">Check preferred dates for a private stay, explore the details of the residence or speak with the estate team about an approved event.</EstateText><div className="mt-8 flex flex-wrap justify-center gap-4"><EstateActionLink variant="button" href="/availability">Check Availability</EstateActionLink><EstateActionLink href="/estate" className="text-[var(--soe-surface-text-primary)]">Explore the Estate</EstateActionLink><EstateActionLink href="/contact" className="text-[var(--soe-surface-text-primary)]">Event Enquiry</EstateActionLink></div></div></EstateContainer></EstateSection>
    </div>
  );
}
