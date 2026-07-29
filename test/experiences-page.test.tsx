import ExperiencesPage, { metadata } from "@/app/(marketing)/experiences/page";
import MarketingLayout from "@/app/(marketing)/layout";
import { publicInformation } from "@/config/public-information";
import { render, screen } from "@testing-library/react";
import * as fs from "fs";
import * as path from "path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ usePathname: () => "/experiences" }));

describe("ExperiencesPage", () => {
  it("exports the canonical metadata and one H1", () => {
    expect(metadata.title).toBe("Experiences | Private Stays & Gatherings at Silver Oak Estate");
    render(<ExperiencesPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Experiences at Silver Oak Estate");
  });

  it("keeps one main landmark within the marketing layout", () => {
    render(<MarketingLayout><ExperiencesPage /></MarketingLayout>);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("preserves capacity and written-approval facts without instant event booking", () => {
    render(<ExperiencesPage />);
    const text = document.body.textContent || "";
    expect(text).toContain(publicInformation.capacity.overnightLabel.toLowerCase());
    expect(text).toContain(publicInformation.capacity.indoorLabel.toLowerCase());
    expect(text).toContain(publicInformation.capacity.standardDayEventLabel.toLowerCase());
    expect(text).toContain(publicInformation.capacity.largerEventStatement);
    expect(text.toLowerCase()).not.toContain("instant event");
  });

  it("qualifies optional arrangements", () => {
    render(<ExperiencesPage />);
    const text = document.body.textContent || "";
    for (const phrase of ["catering", "DJ", "photography", "on request", "subject to availability", "written confirmation"]) {
      expect(text).toContain(phrase);
    }
  });

  it("uses only verified experience image paths with meaningful alt text", () => {
    const { container } = render(<ExperiencesPage />);
    const images = Array.from(container.querySelectorAll("img"));
    expect(images).toHaveLength(7);
    images.forEach((image) => {
      expect(decodeURIComponent(image.getAttribute("src") || "")).toContain("/images/estate/experiences/");
      expect(image.getAttribute("alt")?.trim().length).toBeGreaterThan(8);
      expect(image.getAttribute("sizes")).toBeTruthy();
    });
  });

  it("routes stays to availability and event discussion to contact without /book", () => {
    const { container } = render(<ExperiencesPage />);
    expect(screen.getByRole("link", { name: "Check Availability" })).toHaveAttribute("href", "/availability");
    expect(screen.getByRole("link", { name: "Plan a Private Stay" })).toHaveAttribute("href", "/availability");
    expect(screen.getByRole("link", { name: "Discuss an event" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "Discuss an Approved Event" })).toHaveAttribute("href", "/contact");
    expect(container.querySelector('a[href="/book"]')).toBeNull();
  });

  it("uses the estate UI and no nested main landmark", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/app/(marketing)/experiences/page.tsx"), "utf8");
    expect(source).toContain("@/components/estate-ui/estate-section");
    expect(source).toContain("@/config/public-information");
    expect(source).not.toContain("<main");
  });
});
