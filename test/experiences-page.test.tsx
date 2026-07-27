import ExperiencesPage, { metadata } from "@/app/(marketing)/experiences/page";
import MarketingLayout from "@/app/(marketing)/layout";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/navigation for layout component
vi.mock("next/navigation", () => ({
  usePathname: () => "/experiences",
}));

describe("ExperiencesPage Component", () => {
  it("exports exact metadata title and description", () => {
    expect(metadata.title).toBe("Experiences | Private Stays & Gatherings at Silver Oak Estate");
    expect(metadata.description).toBe(
      "Discover private stays, approved gatherings, pool and lawn time at Silver Oak Estate in Sector 135, Noida. Fully furnished 3 BHK farmhouse for 6–10 overnight guests."
    );
  });

  it("verifies single main landmark when rendered within MarketingLayout", () => {
    render(
      <MarketingLayout>
        <ExperiencesPage />
      </MarketingLayout>
    );

    const mainLandmarks = screen.getAllByRole("main");
    expect(mainLandmarks).toHaveLength(1);
    expect(mainLandmarks[0]).toHaveAttribute("id", "main-content");
  });

  it("renders exactly one H1 heading", () => {
    render(<ExperiencesPage />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Experiences at Silver Oak Estate");
  });

  it("renders required section headings", () => {
    render(<ExperiencesPage />);
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toContain("Designed for Private Stays, Gatherings & Shared Evenings");
    expect(h2s).toContain("Poolside, Lawn & Open-Air Recreation");
    expect(h2s).toContain("Restful Private Residence");
    expect(h2s).toContain("Thoughtfully Hosted Private Events");
    expect(h2s).toContain("Plan Your Experience at Silver Oak Estate");
  });

  it("verifies all 7 rendered page images use exact production WebP paths, alt text and sizes", () => {
    const { container } = render(<ExperiencesPage />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(7);

    const expectedImages = [
      {
        path: "/images/estate/experiences/experiences-hero.webp",
        alt: "Silver Oak Estate exterior daytime view showing private grounds",
        sizes: "(max-width: 1023px) 100vw, 50vw",
      },
      {
        path: "/images/estate/experiences/experiences-stay.webp",
        alt: "Furnished bedroom at Silver Oak Estate for overnight stays",
        sizes: "(max-width: 767px) 100vw, 33vw",
      },
      {
        path: "/images/estate/experiences/experiences-gather.webp",
        alt: "Party pool and deck at Silver Oak Estate for private gatherings",
        sizes: "(max-width: 767px) 100vw, 33vw",
      },
      {
        path: "/images/estate/experiences/experiences-dining.webp",
        alt: "Dedicated dining area at Silver Oak Estate",
        sizes: "(max-width: 767px) 100vw, 33vw",
      },
      {
        path: "/images/estate/experiences/experiences-pool-lawn.webp",
        alt: "Adult-size party pool deck at Silver Oak Estate",
        sizes: "(max-width: 1023px) 100vw, 50vw",
      },
      {
        path: "/images/estate/experiences/experiences-residence.webp",
        alt: "Comfortable indoor seating lounge at Silver Oak Estate",
        sizes: "(max-width: 1023px) 100vw, 50vw",
      },
      {
        path: "/images/estate/experiences/experiences-lawn-evening.webp",
        alt: "Night-time lawn lighting at Silver Oak Estate for evening gatherings",
        sizes: "(max-width: 1023px) 100vw, 50vw",
      },
    ];

    expectedImages.forEach((spec) => {
      const img = screen.getByAltText(spec.alt);
      expect(img).toBeInTheDocument();
      const decodedSrc = decodeURIComponent(img.getAttribute("src") || "");
      expect(decodedSrc).toContain(spec.path);
      expect(img.getAttribute("sizes")).toBe(spec.sizes);
    });
  });

  it("verifies every CTA destination separately by explicit link text", () => {
    render(<ExperiencesPage />);

    const exploreLink = screen.getByRole("link", { name: "Explore the Estate" });
    expect(exploreLink).toHaveAttribute("href", "/estate");

    const viewEstateLink = screen.getByRole("link", { name: "View the Estate" });
    expect(viewEstateLink).toHaveAttribute("href", "/estate");

    const availabilityLinks = screen.getAllByRole("link", { name: "Check Availability" });
    expect(availabilityLinks).toHaveLength(2);
    availabilityLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/availability");
    });

    const galleryLink = screen.getByRole("link", { name: "View Gallery" });
    expect(galleryLink).toHaveAttribute("href", "/gallery");

    const emailLink = screen.getByRole("link", { name: "Email an Enquiry" });
    expect(emailLink).toHaveAttribute("href", "mailto:contact@silveroakestate.online");
  });

  it("verifies capacity wording contains approximately 30–40 guests and does not contain up to 30–40 guests", () => {
    render(<ExperiencesPage />);
    const text = document.body.textContent || "";
    expect(text).toContain("approximately 30–40 guests");
    expect(text).not.toContain("up to 30–40 guests");
  });

  it("verifies optional-service coverage terms together in approved gatherings section", () => {
    render(<ExperiencesPage />);

    const heading = screen.getByRole("heading", {
      name: "Thoughtfully Hosted Private Events",
      level: 2,
    });
    const section = heading.closest("section");

    expect(section).not.toBeNull();

    const text = section?.textContent || "";

    expect(text).toContain("catering");
    expect(text).toContain("DJ");
    expect(text).toContain("photography or shoots");
    expect(text).toContain("available on request");
    expect(text).toContain("subject to availability");
    expect(text).toContain("written confirmation");
    expect(text).toContain("case-by-case basis");
  });

  it("verifies confirmed guest capacities and factual property attributes", () => {
    render(<ExperiencesPage />);
    const text = document.body.textContent || "";
    expect(text).toContain("6–10");
    expect(text).toContain("15–20");
    expect(text).toContain("Sector 135, Noida");
  });

  it("verifies absence of phone numbers, whatsapp links and prohibited terms", () => {
    render(<ExperiencesPage />);
    const text = (document.body.textContent || "").toLowerCase();

    expect(text).not.toContain("whatsapp");
    expect(text).not.toMatch(/\+91\d{10}/);

    const prohibitedTerms = [
      "best",
      "no. 1",
      "world-class",
      "guaranteed",
      "unlimited",
      "all-inclusive",
      "lifeguard",
      "spa",
      "gym",
      "restaurant",
      "bar",
      "valet",
      "pet-friendly",
      "children's pool",
      "children’s pool",
      "wedding package",
      "complimentary dj",
      "complimentary catering",
      "security deposit",
      "gst",
      "overtime fee",
      "extra guest fee",
    ];

    prohibitedTerms.forEach((term) => {
      const regex = new RegExp(`\\b${term.replace("'", "['’]")}\\b`, "i");
      expect(regex.test(text)).toBe(false);
    });
  });
});
