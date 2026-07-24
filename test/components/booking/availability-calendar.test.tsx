import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AvailabilityCalendar } from "../../../src/components/booking/availability-calendar";
import { AvailabilityDay } from "../../../src/components/booking/availability-day";

global.fetch = vi.fn();

describe("AvailabilityDay", () => {
  it("today", () => {
    render(<AvailabilityDay dateStr="2024-12-01" dayOfMonth={1} available={true} priceAmountPaise={10000} isPast={false} isSelected={false} isToday={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", expect.stringContaining("Today"));
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

  it("retry", async () => {
    // @ts-expect-error mock
    global.fetch.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ dates: [] }) });
    
    render(<AvailabilityCalendar />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load calendar/i)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/Retry/i));
    
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
