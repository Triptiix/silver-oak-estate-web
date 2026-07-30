import { readFileSync, existsSync } from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("next/font/google", () => ({
  Newsreader: () => ({ variable: "--font-newsreader" }),
  Manrope: () => ({ variable: "--font-manrope" }),
}));

import { metadata as rootMetadata } from "@/app/layout";
import { metadata as adminMetadata } from "@/app/admin/layout";
import { metadata as bookMetadata } from "@/app/(marketing)/book/page";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import NotFound from "@/app/not-found";
import { siteConfig } from "@/config/site";

afterEach(() => cleanup());

// Public marketing/legal routes and their expected canonical paths.
const PUBLIC_ROUTES = [
  ["@/app/(marketing)/page", "/"],
  ["@/app/(marketing)/estate/page", "/estate"],
  ["@/app/(marketing)/experiences/page", "/experiences"],
  ["@/app/(marketing)/gallery/page", "/gallery"],
  ["@/app/(marketing)/pricing/page", "/pricing"],
  ["@/app/(marketing)/location/page", "/location"],
  ["@/app/(marketing)/availability/page", "/availability"],
  ["@/app/(marketing)/contact/page", "/contact"],
  ["@/app/(marketing)/policies/page", "/policies"],
  ["@/app/(marketing)/privacy/page", "/privacy"],
  ["@/app/(marketing)/terms/page", "/terms"],
] as const;

async function metadataFor(mod: string) {
  return (await import(/* @vite-ignore */ mod)).metadata;
}

function titleString(title: unknown): string {
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title) {
    return String((title as { absolute: string }).absolute);
  }
  return String(title);
}

describe("readiness — canonical URLs", () => {
  it("gives every public route a canonical matching its path", async () => {
    for (const [mod, expected] of PUBLIC_ROUTES) {
      const meta = await metadataFor(mod);
      expect(meta?.alternates?.canonical, `${mod} canonical`).toBe(expected);
    }
  });

  it("derives the canonical origin from configured site URL, not a hardcoded domain", () => {
    expect(String(rootMetadata.metadataBase)).toContain(
      new URL(siteConfig.url).host,
    );
    const layoutSource = readFileSync("src/app/layout.tsx", "utf8");
    expect(layoutSource).not.toMatch(/https:\/\/(?!.*siteConfig)[a-z0-9.-]+\.[a-z]{2,}/);
  });
});

describe("readiness — page titles", () => {
  it("never repeats the site name twice in a rendered title", async () => {
    const template = "| Silver Oak Estate";
    for (const [mod] of PUBLIC_ROUTES) {
      const meta = await metadataFor(mod);
      const raw = meta.title;
      // A plain string title gets the site-name template appended, so it must
      // not already contain the site name.
      if (typeof raw === "string") {
        expect(raw, `${mod} would double the site name`).not.toContain(
          "Silver Oak Estate",
        );
      } else {
        // An absolute title bypasses the template and may name the site once.
        const abs = titleString(raw);
        const occurrences = abs.split("Silver Oak Estate").length - 1;
        expect(occurrences, `${mod} names the site ${occurrences} times`)
          .toBeLessThanOrEqual(1);
      }
      expect(titleString(raw).trim().length).toBeGreaterThan(0);
      void template;
    }
  });

  it("gives every public route a non-empty description", async () => {
    for (const [mod] of PUBLIC_ROUTES) {
      const meta = await metadataFor(mod);
      if (mod.includes("privacy") || mod.includes("terms")) continue; // stub pages, owner-owned
      expect(String(meta.description ?? "").length, `${mod} description`)
        .toBeGreaterThan(30);
    }
  });
});

describe("readiness — social metadata", () => {
  it("declares Open Graph and Twitter cards with a real image asset", () => {
    const og = rootMetadata.openGraph as {
      siteName?: string;
      type?: string;
      images?: Array<{ url: string }>;
    };
    const twitter = rootMetadata.twitter as { card?: string };

    expect(og?.siteName).toBe(siteConfig.name);
    expect(og?.type).toBe("website");
    expect(og?.images?.length).toBeGreaterThan(0);
    const asset = og.images![0].url;
    expect(existsSync(path.join(process.cwd(), "public", asset))).toBe(true);
    expect(twitter?.card).toBe("summary_large_image");
  });
});

describe("readiness — indexing controls", () => {
  it("marks every administrator route noindex", () => {
    expect(adminMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("marks the capability-disabled booking route noindex", () => {
    expect(bookMetadata.robots).toMatchObject({ index: false });
  });

  it("keeps admin and api disallowed in robots and out of the sitemap", () => {
    const r = robots();
    const disallow = ([] as string[]).concat(
      (r.rules as { disallow?: string | string[] }).disallow ?? [],
    );
    expect(disallow).toEqual(expect.arrayContaining(["/api/", "/admin/"]));

    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/api"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/book"))).toBe(false);
  });

  it("builds sitemap and robots from the configured site URL", () => {
    for (const entry of sitemap()) {
      expect(entry.url.startsWith(siteConfig.url)).toBe(true);
    }
    expect(robots().sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
  });
});

describe("readiness — not-found page", () => {
  it("renders a landmark, one H1 and safe recovery links", () => {
    render(<NotFound />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" }))
      .toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Check availability" }))
      .toHaveAttribute("href", "/availability");
    expect(screen.getByRole("link", { name: "Contact the estate" }))
      .toHaveAttribute("href", "/contact");
  });

  it("exposes no booking route and no private details", () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector('a[href="/book"]')).toBeNull();
    expect(container.querySelector('a[href^="/admin"]')).toBeNull();
  });
});

describe("readiness — external link safety", () => {
  it("pairs every target=_blank with noopener noreferrer", () => {
    const files = [
      "src/app/(marketing)/contact/page.tsx",
      "src/app/(marketing)/location/page.tsx",
      "src/app/(marketing)/availability/page.tsx",
      "src/components/booking/booking-unavailable.tsx",
      "src/components/booking/selected-date-summary.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const blanks = source.split('target="_blank"').length - 1;
      const safe = source.split('rel="noopener noreferrer"').length - 1;
      expect(safe, `${file} has ${blanks} blank targets but ${safe} safe rels`)
        .toBeGreaterThanOrEqual(blanks);
    }
  });
});

describe("readiness — pricing definition list", () => {
  it("keeps <dl> groups free of non dt/dd content", () => {
    const source = readFileSync("src/app/(marketing)/pricing/page.tsx", "utf8");
    const dl = source.slice(source.indexOf("<dl"), source.indexOf("</dl>"));
    expect(dl).not.toMatch(/<p\b/);
  });
});

describe("readiness — booking capability stays disabled", () => {
  it("does not enable online booking anywhere in committed config", () => {
    for (const file of [".env", ".env.example"]) {
      if (!existsSync(file)) continue;
      const source = readFileSync(file, "utf8");
      const match = source.match(/^ONLINE_BOOKING_ENABLED=(.*)$/m);
      if (match) expect(match[1].replace(/["']/g, "").trim()).not.toBe("true");
    }
  });

  it("keeps /book unlinked from public navigation and footer", () => {
    for (const file of [
      "src/components/layout/site-header.tsx",
      "src/components/layout/site-footer.tsx",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/href="\/book"/);
    }
  });
});
