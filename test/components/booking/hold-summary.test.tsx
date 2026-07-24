import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HoldSummary } from "../../../src/components/booking/hold-summary";

describe("HoldSummary", () => {
  it("displays all three money values and absence of payment button", () => {
    const hold = {
      bookingReference: "REF-123",
      checkInAt: "2024-12-05T14:00:00Z",
      checkOutAt: "2024-12-06T10:00:00Z",
      holdExpiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
      priceAmountPaise: 1000000, // 10,000
      advanceAmountPaise: 500000, // 5,000
      balanceAmountPaise: 500000,
      currency: "INR",
      version: 1 as const
    };
    
    render(<HoldSummary hold={hold} onExpire={vi.fn()} onRelease={vi.fn()} />);
    
    expect(screen.getByText("₹10,000")).toBeInTheDocument(); // Total Price
    expect(screen.getAllByText("₹5,000")).toHaveLength(2); // Advance and Balance
    
    // Ensure payment button is completely removed
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(1); // Only the release button should exist
    expect(screen.queryByText(/Secure online payment will be enabled in the next implementation phase/i, { selector: 'button' })).not.toBeInTheDocument();
    
    // Check informational text is present
    expect(screen.getByText(/Secure online payment will be enabled in the next implementation phase/i)).toBeInTheDocument();
  });
});
