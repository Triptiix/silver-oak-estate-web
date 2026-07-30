import * as fs from "fs";
import * as path from "path";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GalleryPage from "@/app/(marketing)/gallery/page";
import HomePage from "@/app/(marketing)/page";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/capabilities/online-booking", () => ({
  getOnlineBookingCapability: () => ({
    available: false,
    state: "disabled",
    missingFields: [],
  }),
}));

const HERO_PRIMARY = "/images/estate/home/hero-page.PNG";
const HERO_INSET = "/images/estate/home/hero 1.PNG";

const GALLERY_PRIORITY_IMAGES = [
  "/images/estate/experiences/deck01.PNG",
  "/images/estate/estate/estate-deck-03.PNG",
  "/images/estate/estate/estate-dinning-03.PNG",
  "/images/estate/estate/estate-Bedroom-02.PNG",
  "/images/estate/estate/estate-bedroom-03.PNG",
  "/images/estate/estate/estate-kitchen-03.PNG",
] as const;

// next/image rewrites src to /_next/image?url=<encoded>&w=…&q=…
function originalSource(image: Element) {
  const raw = decodeURIComponent(image.getAttribute("src") || "");
  const match = raw.match(/[?&]url=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : raw;
}

function renderedSources(container: HTMLElement) {
  return Array.from(container.querySelectorAll("img")).map(originalSource);
}

function publicPathFor(source: string) {
  return path.join(process.cwd(), "public", source.replace(/^\//, ""));
}

describe("premium image refresh — priority assets", () => {
  it("resolves every newly added priority image to a real file on disk", () => {
    for (const source of [HERO_PRIMARY, HERO_INSET, ...GALLERY_PRIORITY_IMAGES]) {
      expect(fs.existsSync(publicPathFor(source)), `missing asset: ${source}`).toBe(
        true,
      );
    }
  });
});

describe("premium image refresh — homepage hero", () => {
  it("uses both new hero photographs with distinct meaningful alt text", () => {
    const { container } = render(<HomePage />);
    const sources = renderedSources(container);

    expect(sources).toContain(HERO_PRIMARY);
    expect(sources).toContain(HERO_INSET);

    const heroImages = Array.from(container.querySelectorAll("img")).filter(
      (image) =>
        ([HERO_PRIMARY, HERO_INSET] as string[]).includes(originalSource(image)),
    );
    expect(heroImages).toHaveLength(2);

    const alts = heroImages.map((image) => image.getAttribute("alt") ?? "");
    expect(new Set(alts).size).toBe(2);
    for (const alt of alts) {
      expect(alt.trim().length).toBeGreaterThan(20);
    }
  });

  it("keeps a single preloaded hero image and gives the inset a stable aspect box", () => {
    const { container } = render(<HomePage />);

    const eager = Array.from(container.querySelectorAll("img")).filter(
      (image) => image.getAttribute("loading") !== "lazy",
    );
    expect(eager).toHaveLength(1);
    expect(originalSource(eager[0])).toBe(HERO_PRIMARY);

    const inset = container.querySelector(`img[src*="hero"][loading="lazy"]`);
    expect(inset).not.toBeNull();
    expect(inset?.getAttribute("sizes")).toBeTruthy();
    // A fixed aspect-ratio wrapper keeps the inset from shifting layout on load.
    expect(inset?.parentElement?.className).toContain("aspect-[16/10]");
  });

  it("keeps every homepage image inside the home asset folder", () => {
    const { container } = render(<HomePage />);
    for (const source of renderedSources(container)) {
      expect(source).toContain("/images/estate/home/");
    }
  });
});

describe("premium image refresh — gallery curation", () => {
  it("includes all six remaining priority photographs", () => {
    const { container } = render(<GalleryPage />);
    const sources = renderedSources(container);

    for (const source of GALLERY_PRIORITY_IMAGES) {
      expect(sources, `gallery is missing ${source}`).toContain(source);
    }
  });

  it("surfaces the new photography early rather than burying it", () => {
    const { container } = render(<GalleryPage />);
    const sources = renderedSources(container).slice(1); // drop the hero image
    const firstFive = sources.slice(0, 5);

    expect(
      firstFive.filter((source) =>
        (GALLERY_PRIORITY_IMAGES as readonly string[]).includes(source),
      ).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("tiles the three-column grid without leaving an empty cell", () => {
    const { container } = render(<GalleryPage />);
    const figures = Array.from(container.querySelectorAll("figure"));

    const columnsPerRow = 3;
    const used = figures.reduce((total, figure) => {
      const wide = figure.className.includes("md:col-span-2");
      const tall = figure.className.includes("md:row-span-2");
      return total + (wide ? 2 : 1) * (tall ? 2 : 1);
    }, 0);

    expect(figures).toHaveLength(12);
    expect(used % columnsPerRow).toBe(0);
  });

  it("drops the redundant duplicate experience photographs", () => {
    const { container } = render(<GalleryPage />);
    const sources = renderedSources(container);

    expect(sources).not.toContain(
      "/images/estate/experiences/experiences-dining.webp",
    );
    expect(sources).not.toContain(
      "/images/estate/experiences/experiences-pool-lawn.webp",
    );
  });

  it("gives every gallery tile non-empty alt text and a sizes hint", () => {
    const { container } = render(<GalleryPage />);
    const images = Array.from(container.querySelectorAll("img"));

    const alts = images.map((image) => image.getAttribute("alt") ?? "");
    expect(new Set(alts).size).toBe(alts.length);

    for (const image of images) {
      expect((image.getAttribute("alt") ?? "").trim().length).toBeGreaterThan(8);
      expect(image.getAttribute("sizes")).toBeTruthy();
    }
  });
});
