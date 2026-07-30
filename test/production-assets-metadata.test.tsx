import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("next/font/google", () => ({
  Newsreader: () => ({ variable: "--font-newsreader" }),
  Manrope: () => ({ variable: "--font-manrope" }),
}));

import { metadata as rootMetadata } from "@/app/layout";
import manifest from "@/app/manifest";
import { SHARE_IMAGE } from "@/lib/seo/page-metadata";
import { EstateStructuredData } from "@/components/seo/estate-structured-data";
import { publicInformation } from "@/config/public-information";
import { siteConfig } from "@/config/site";

afterEach(() => cleanup());

const pub = (p: string) => path.join(process.cwd(), "public", p.replace(/^\//, ""));

/** Reads intrinsic dimensions straight from the file header. */
function dimensionsOf(file: string): { format: string; width: number; height: number } {
  const b = readFileSync(file);
  if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { format: "png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP") {
    const chunk = b.slice(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      return {
        format: "webp",
        width: 1 + b.readUIntLE(24, 3),
        height: 1 + b.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { format: "webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    // Simple lossy VP8
    return {
      format: "webp",
      width: b.readUInt16LE(26) & 0x3fff,
      height: b.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`unrecognised image header: ${file}`);
}

const CONVERTED = [
  ["/images/estate/home/hero-page.webp", 1375, 1144],
  ["/images/estate/home/hero-evening.webp", 1641, 958],
  ["/images/estate/experiences/deck-01.webp", 1313, 1198],
  ["/images/estate/estate/estate-deck-03.webp", 1085, 1450],
  ["/images/estate/estate/estate-kitchen-03.webp", 1097, 1434],
  ["/images/estate/estate/estate-dining-03.webp", 1415, 1111],
  ["/images/estate/estate/estate-bedroom-02.webp", 1423, 1105],
  ["/images/estate/estate/estate-bedroom-03.webp", 1448, 1086],
] as const;

const RETIRED_PNGS = [
  "/images/estate/home/hero 1.PNG",
  "/images/estate/home/hero-page.PNG",
  "/images/estate/experiences/deck01.PNG",
  "/images/estate/estate/estate-deck-03.PNG",
  "/images/estate/estate/estate-kitchen-03.PNG",
  "/images/estate/estate/estate-dinning-03.PNG",
  "/images/estate/estate/estate-Bedroom-02.PNG",
  "/images/estate/estate/estate-bedroom-03.PNG",
] as const;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|mjs|js)$/.test(e.name) ? [full] : [];
  });
}

describe("assets — converted estate imagery", () => {
  it("ships all eight WebP assets at their original dimensions", () => {
    for (const [rel, w, h] of CONVERTED) {
      const file = pub(rel);
      expect(existsSync(file), `${rel} missing`).toBe(true);
      const d = dimensionsOf(file);
      expect(d.format, `${rel} format`).toBe("webp");
      expect([d.width, d.height], `${rel} dimensions`).toEqual([w, h]);
    }
  });

  it("removes the retired PNG sources from the current tree", () => {
    for (const rel of RETIRED_PNGS) {
      expect(existsSync(pub(rel)), `${rel} should be deleted`).toBe(false);
    }
  });

  it("leaves no source or test reference to a retired PNG", () => {
    const selfPath = path.join("test", "production-assets-metadata.test.tsx");
    // This spec deliberately names the retired paths in order to assert their
    // absence, so it is excluded from its own scan.
    const files = [...sourceFiles("src"), ...sourceFiles("test")].filter(
      (f) => path.normalize(f) !== path.normalize(selfPath),
    );
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const rel of RETIRED_PNGS) {
        expect(source.includes(rel), `${file} still references ${rel}`).toBe(false);
      }
      expect(/\.PNG\b/.test(source), `${file} references a .PNG asset`).toBe(false);
    }
  });

  it("points the pages at the new WebP assets", () => {
    const home = readFileSync("src/app/(marketing)/page.tsx", "utf8");
    expect(home).toContain("/images/estate/home/hero-page.webp");
    expect(home).toContain("/images/estate/home/hero-evening.webp");

    const gallery = readFileSync("src/app/(marketing)/gallery/page.tsx", "utf8");
    for (const [rel] of CONVERTED.slice(2)) expect(gallery).toContain(rel);
  });

  it("keeps the two composite bedroom images as single referenced assets", () => {
    const gallery = readFileSync("src/app/(marketing)/gallery/page.tsx", "utf8");
    for (const rel of [
      "/images/estate/estate/estate-bedroom-02.webp",
      "/images/estate/estate/estate-bedroom-03.webp",
    ]) {
      expect(gallery.split(rel).length - 1, `${rel} reference count`).toBe(1);
    }
    // Their alt text still describes them honestly as multiple views.
    expect(gallery).toMatch(/Two views of a bedroom/);
    expect(gallery).toMatch(/Three views of a bedroom/);
  });
});

describe("assets — dedicated social image", () => {
  it("is a 1200x630 WebP that exists on disk", () => {
    const file = pub(SHARE_IMAGE.url);
    expect(existsSync(file)).toBe(true);
    const d = dimensionsOf(file);
    expect(d.format).toBe("webp");
    expect([d.width, d.height]).toEqual([1200, 630]);
    expect(SHARE_IMAGE.width).toBe(1200);
    expect(SHARE_IMAGE.height).toBe(630);
    // Generous upper bound: guards against an accidental huge asset without
    // failing on harmless encoder differences.
    expect(statSync(file).size).toBeLessThan(400 * 1024);
  });

  it("is used by root Open Graph and Twitter metadata", () => {
    const og = rootMetadata.openGraph as { images?: Array<{ url: string }> };
    const twitter = rootMetadata.twitter as { images?: string[] };
    expect(og?.images?.[0]?.url).toBe(SHARE_IMAGE.url);
    expect(twitter?.images?.[0]).toBe(SHARE_IMAGE.url);
  });

  it("no longer references the oversized estate exterior as a share image", () => {
    for (const file of ["src/app/layout.tsx", "src/lib/seo/page-metadata.ts"]) {
      expect(readFileSync(file, "utf8")).not.toContain(
        'images/estate/home/hero-estate-exterior.webp"',
      );
    }
  });
});

describe("assets — icons", () => {
  it("ships an apple icon and both manifest icons at the declared sizes", () => {
    const apple = dimensionsOf(path.join(process.cwd(), "src/app/apple-icon.png"));
    expect([apple.format, apple.width, apple.height]).toEqual(["png", 180, 180]);

    const i192 = dimensionsOf(pub("/icons/silver-oak-estate-192.png"));
    expect([i192.format, i192.width, i192.height]).toEqual(["png", 192, 192]);

    const i512 = dimensionsOf(pub("/icons/silver-oak-estate-512.png"));
    expect([i512.format, i512.width, i512.height]).toEqual(["png", 512, 512]);
  });

  it("keeps the existing favicon in place", () => {
    expect(existsSync(path.join(process.cwd(), "src/app/favicon.ico"))).toBe(true);
  });
});

describe("manifest", () => {
  const m = manifest();

  it("declares truthful identity and scope", () => {
    expect(m.name).toBe(siteConfig.name);
    expect(m.short_name).toBe("Silver Oak");
    expect(m.description).toBe(siteConfig.description);
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
  });

  it("does not claim installable or offline capability", () => {
    // No service worker, offline mode or install prompt ships in this phase.
    expect(m.display).toBe("browser");
    // Assert on the emitted manifest, not the source text, so explanatory
    // comments cannot trip the check.
    const emitted = JSON.stringify(m);
    expect(emitted).not.toMatch(/standalone|fullscreen|minimal-ui/);
    expect(emitted).not.toMatch(/serviceworker|service-worker|offline|prefer_related/i);
    expect(m).not.toHaveProperty("prefer_related_applications");
    expect(m).not.toHaveProperty("related_applications");
  });

  it("uses existing brand colours", () => {
    expect(m.background_color).toBe("#f5f1e8");
    expect(m.theme_color).toBe("#0d0f0e");
  });

  it("references both icons by absolute site path and nothing else", () => {
    const icons = m.icons ?? [];
    expect(icons.map((i) => i.sizes)).toEqual(["192x192", "512x512"]);
    for (const icon of icons) {
      expect(icon.src.startsWith("/")).toBe(true);
      expect(icon.src).not.toMatch(/localhost|vercel\.app|https?:/);
      expect(icon.type).toBe("image/png");
      expect(existsSync(pub(icon.src)), `${icon.src} missing`).toBe(true);
    }
  });

  it("exposes no booking route", () => {
    expect(JSON.stringify(m)).not.toContain("/book");
  });
});

describe("structured data", () => {
  function json() {
    const { container } = render(<EstateStructuredData />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    return { raw: scripts[0].innerHTML, data: JSON.parse(scripts[0].innerHTML) };
  }

  it("renders exactly one valid JSON-LD block", () => {
    const { data } = json();
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toEqual(["LodgingBusiness", "EventVenue"]);
  });

  it("uses only verified identity, contact and address values", () => {
    const { data } = json();
    expect(data.name).toBe(siteConfig.name);
    expect(data.description).toBe(siteConfig.description);
    expect(data.url).toBe(siteConfig.url);
    expect(data.image).toBe(`${siteConfig.url}${SHARE_IMAGE.url}`);
    expect(data.email).toBe(publicInformation.contact.email);
    expect(data.telephone).toBe(publicInformation.contact.primaryPhone.e164);

    const a = publicInformation.location.postalAddress;
    expect(data.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: a.streetAddress,
      addressLocality: a.addressLocality,
      addressRegion: a.addressRegion,
      postalCode: a.postalCode,
      addressCountry: a.addressCountry,
    });
  });

  it("keeps the structured address an exact mirror of the published address", () => {
    const a = publicInformation.location.postalAddress;
    const full = publicInformation.location.fullAddress;
    for (const part of [
      a.streetAddress,
      a.addressLocality,
      a.addressRegion,
      a.postalCode,
    ]) {
      expect(full, `"${part}" is not part of the published address`).toContain(part);
    }
  });

  it("omits every unverified or untrue claim", () => {
    const { raw, data } = json();
    for (const key of [
      "aggregateRating",
      "review",
      "starRating",
      "geo",
      "openingHours",
      "openingHoursSpecification",
      "sameAs",
      "priceRange",
      "paymentAccepted",
      "currenciesAccepted",
      "makesOffer",
      "offers",
      "potentialAction",
      "founder",
      "legalName",
      "vatID",
      "taxID",
    ]) {
      expect(data[key], `${key} must be absent`).toBeUndefined();
      expect(raw).not.toContain(`"${key}"`);
    }
  });

  it("advertises no booking action while online booking is disabled", () => {
    const { raw } = json();
    expect(raw).not.toContain("ReserveAction");
    expect(raw).not.toContain("/book");
    expect(raw).not.toContain("reservation");
  });

  it("contains no customer data and escapes script-terminating characters", () => {
    const { raw } = json();
    expect(raw).not.toContain("<");
    expect(raw).not.toMatch(/customer|guest_name|booking_reference|SOE-\d{8}/i);
  });

  it("is rendered by the marketing layout only, never the admin layout", () => {
    expect(readFileSync("src/app/(marketing)/layout.tsx", "utf8"))
      .toContain("<EstateStructuredData />");
    expect(readFileSync("src/app/admin/layout.tsx", "utf8"))
      .not.toContain("EstateStructuredData");
  });
});

describe("booking gates still closed", () => {
  it("keeps online booking disabled in committed configuration", () => {
    for (const file of [".env", ".env.example"]) {
      if (!existsSync(file)) continue;
      const match = readFileSync(file, "utf8").match(/^ONLINE_BOOKING_ENABLED=(.*)$/m);
      if (match) expect(match[1].replace(/["']/g, "").trim()).not.toBe("true");
    }
  });

  it("adds no /book link to navigation, manifest or structured data", () => {
    const { container } = render(<EstateStructuredData />);
    expect(container.innerHTML).not.toContain("/book");
    expect(JSON.stringify(manifest())).not.toContain("/book");
    for (const file of [
      "src/components/layout/site-header.tsx",
      "src/components/layout/site-footer.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toMatch(/href="\/book"/);
    }
  });
});
