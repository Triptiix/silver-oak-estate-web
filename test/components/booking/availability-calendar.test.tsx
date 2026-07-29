import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AvailabilityCalendar } from "../../../src/components/booking/availability-calendar";
import { AvailabilityDay } from "../../../src/components/booking/availability-day";

global.fetch = vi.fn();

describe("AvailabilityDay", () => {
  it.each([
    {
      state: "past",
      available: true,
      isPast: true,
      isSelected: false,
      expectedStatus: "Past date",
      disabled: true,
    },
    {
      state: "unavailable",
      available: false,
      isPast: false,
      isSelected: false,
      expectedStatus: "Unavailable",
      disabled: true,
    },
    {
      state: "selected",
      available: true,
      isPast: false,
      isSelected: true,
      expectedStatus: "Selected",
      disabled: false,
    },
  ])("keeps the today border visible when the date is $state", ({
    available,
    isPast,
    isSelected,
    expectedStatus,
    disabled,
  }) => {
    render(
      <AvailabilityDay
        dateStr="2024-12-01"
        dayOfMonth={1}
        available={available}
        priceAmountPaise={10000}
        isPast={isPast}
        isSelected={isSelected}
        isToday
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-[var(--soe-color-brand)]");
    expect(button).toHaveClass("border-2");
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Today"),
    );
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining(expectedStatus),
    );

    if (disabled) {
      expect(button).toBeDisabled();
    } else {
      expect(button).toBeEnabled();
    }
  });

  it("past", () => {
    render(<AvailabilityDay dateStr="2024-12-01" dayOfMonth={1} available={true} priceAmountPaise={10000} isPast={true} isSelected={false} isToday={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", expect.stringContaining("Past date"));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("unavailable", () => {
    render(<AvailabilityDay dateStr="2024-12-01" dayOfMonth={1} available={false} priceAmountPaise={10000} isPast={false} isSelected={false} isToday={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", expect.stringContaining("Unavailable"));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("selected", () => {
    render(<AvailabilityDay dateStr="2024-12-01" dayOfMonth={1} available={true} priceAmountPaise={10000} isPast={false} isSelected={true} isToday={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", expect.stringContaining("Selected"));
  });

  it("API price in accessible label", () => {
    render(<AvailabilityDay dateStr="2024-12-01" dayOfMonth={1} available={true} priceAmountPaise={1500000} isPast={false} isSelected={false} isToday={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", expect.stringContaining("Price ₹15,000"));
  });
});

describe("AvailabilityCalendar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses non-submitting month navigation buttons", () => {
    render(<AvailabilityCalendar />);

    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toHaveAttribute("type", "button");
    expect(
      screen.getByRole("button", { name: "Next month" }),
    ).toHaveAttribute("type", "button");
  });

  it("retry", async () => {
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ dates: [] }) });
    
    render(<AvailabilityCalendar />);
    
    await waitFor(() => {
      expect(
        screen.getByText(/The calendar could not be loaded/i),
      ).toBeInTheDocument();
    });
    
    const retryButton = screen.getByRole("button", { name: "Retry" });
    expect(retryButton).toHaveAttribute("type", "button");
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("cancels request on unmount", async () => {
        const p1 = new Promise((resolve) => {  });
    // @ts-expect-error mock
    global.fetch.mockReturnValueOnce(p1);
    
    const { unmount } = render(<AvailabilityCalendar />);
    
    // @ts-expect-error mock
    const firstCallSignal = global.fetch.mock.calls[0][1]?.signal;
    unmount();
    expect(firstCallSignal?.aborted).toBe(true);
  });
});
