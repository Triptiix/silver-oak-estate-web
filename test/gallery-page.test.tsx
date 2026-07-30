import GalleryPage, { metadata } from "@/app/(marketing)/gallery/page";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Effective <title>: an absolute title renders verbatim; a plain string gets the
// root template's " | Silver Oak Estate" suffix appended.
function effectiveTitle(title: unknown): string {
  if (title && typeof title === "object" && "absolute" in title) {
    return String((title as { absolute: string }).absolute);
  }
  return `${String(title)} | Silver Oak Estate`;
}

describe("GalleryPage", () => {
  it("exports complete metadata and exactly one H1", () => {
    expect(effectiveTitle(metadata.title)).toBe("Gallery | Silver Oak Estate");
    expect(metadata.description).toBe("Explore verified photographs of the residence, bedrooms, lawn, pool, living spaces and evening atmosphere at Silver Oak Estate in Sector 135, Noida.");
    expect(metadata.alternates?.canonical).toBe("/gallery");
    render(<GalleryPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders a meaningful verified editorial image collection with alt text", () => {
    const { container } = render(<GalleryPage />);
    const images = Array.from(container.querySelectorAll("img"));
    expect(images).toHaveLength(13);
    images.forEach((image) => {
      expect(decodeURIComponent(image.getAttribute("src") || "")).toContain("/images/estate/");
      expect(image.getAttribute("alt")?.trim().length).toBeGreaterThan(8);
    });
    expect(container.textContent).not.toContain("Placeholder");
  });

  it("keeps planning links capability-safe and has no legacy container or /book link", () => {
    const { container } = render(<GalleryPage />);
    expect(screen.getByRole("link", { name: "Check Availability" })).toHaveAttribute("href", "/availability");
    expect(screen.getByRole("link", { name: "Explore the Estate" })).toHaveAttribute("href", "/estate");
    expect(screen.getByRole("link", { name: "Event Enquiry" })).toHaveAttribute("href", "/contact");
    expect(container.querySelector('a[href="/book"]')).toBeNull();
  });
});
