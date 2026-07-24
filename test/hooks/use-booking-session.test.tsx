import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBookingSession } from "../../src/hooks/use-booking-session";

describe("useBookingSession", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  it("valid summary restored", () => {
    const validSummary = {
      bookingReference: "REF-123",
      checkInAt: "2024-12-01T14:00:00Z",
      checkOutAt: "2024-12-02T10:00:00Z",
      holdExpiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
      priceAmountPaise: 1000000,
      advanceAmountPaise: 500000,
      balanceAmountPaise: 500000,
      currency: 'INR',
      version: 1
    };
    sessionStorage.setItem("soe_hold_summary", JSON.stringify(validSummary));

    const { result } = renderHook(() => useBookingSession());
    expect(result.current.holdSummary).toEqual(validSummary);
  });

  it("expired summary cleared", () => {
    const expiredSummary = {
      bookingReference: "REF-123",
      checkInAt: "2024-12-01T14:00:00Z",
      checkOutAt: "2024-12-02T10:00:00Z",
      holdExpiresAt: new Date(Date.now() - 10 * 60000).toISOString(), // Expired
      priceAmountPaise: 1000000,
      advanceAmountPaise: 500000,
      balanceAmountPaise: 500000,
      currency: 'INR',
      version: 1
    };
    sessionStorage.setItem("soe_hold_summary", JSON.stringify(expiredSummary));

    const { result } = renderHook(() => useBookingSession());
    expect(result.current.holdSummary).toBeNull();
    expect(sessionStorage.getItem("soe_hold_summary")).toBeNull();
  });

  it("corrupted summary cleared", () => {
    sessionStorage.setItem("soe_hold_summary", "{ corrupted: json");

    const { result } = renderHook(() => useBookingSession());
    expect(result.current.holdSummary).toBeNull();
    expect(sessionStorage.getItem("soe_hold_summary")).toBeNull();
  });

  it("invalid schema cleared", () => {
    const invalidSummary = {
      bookingReference: "REF-123", // Missing other required fields
    };
    sessionStorage.setItem("soe_hold_summary", JSON.stringify(invalidSummary));

    const { result } = renderHook(() => useBookingSession());
    expect(result.current.holdSummary).toBeNull();
    expect(sessionStorage.getItem("soe_hold_summary")).toBeNull();
  });

  it("no PII/token/internal booking ID stored", () => {
    const { result } = renderHook(() => useBookingSession());
    
    act(() => {
      result.current.saveHold({
        bookingReference: "REF-123",
        checkInAt: "2024-12-01T14:00:00Z",
        checkOutAt: "2024-12-02T10:00:00Z",
        holdExpiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
        priceAmountPaise: 1000000,
        advanceAmountPaise: 500000,
      balanceAmountPaise: 500000,
      currency: "INR"
      });
    });

    const stored = JSON.parse(sessionStorage.getItem("soe_hold_summary") || "{}");
    expect(stored.customerEmail).toBeUndefined();
    expect(stored.customerName).toBeUndefined();
    expect(stored.customerPhone).toBeUndefined();
    expect(stored.token).toBeUndefined();
    expect(stored.id).toBeUndefined();
  });
});
