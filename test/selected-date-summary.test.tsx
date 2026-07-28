import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SelectedDateSummary } from "@/components/booking/selected-date-summary";

const sharedProps = {
  dateStr: "2026-08-15",
  priceAmountPaise: 2_000_000,
  advanceAmountPaise: 500_000,
  checkInTime: "11:00 AM",
  checkOutTime: "10:00 AM",
};

describe("selected date summary", () => {
  it("offers a prefilled assisted-booking request when online checkout is disabled", () => {
    render(<SelectedDateSummary {...sharedProps} onlineBookingAvailable={false} />);

    const link = screen.getByRole("link", { name: "Request This Date" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/918679470955\?text=/);
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain("Sat, 15 Aug 2026");
    expect(screen.getByText(/Online checkout is not active yet/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue to Book" })).not.toBeInTheDocument();
  });

  it("keeps the online booking link when the full booking capability is ready", () => {
    render(<SelectedDateSummary {...sharedProps} onlineBookingAvailable />);

    expect(screen.getByRole("link", { name: "Continue to Book" })).toHaveAttribute(
      "href",
      "/book?date=2026-08-15",
    );
    expect(screen.queryByRole("link", { name: "Request This Date" })).not.toBeInTheDocument();
  });
});
