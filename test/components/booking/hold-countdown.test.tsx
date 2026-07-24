import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HoldCountdown } from "../../../src/components/booking/hold-countdown";

describe("HoldCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("absolute timestamp calculation & visibility recalculation", () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    const { unmount } = render(<HoldCountdown expiresAt={expiresAt} onExpire={vi.fn()} />);
    
    expect(screen.getByText("10:00")).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText("9:59")).toBeInTheDocument();
    unmount();
  });

  it("never negative", () => {
    const expiresAt = new Date(Date.now() + 2 * 1000).toISOString(); // 2 seconds
    render(<HoldCountdown expiresAt={expiresAt} onExpire={vi.fn()} />);
    
    act(() => {
      vi.advanceTimersByTime(5000); // Past expiry
    });
    
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("expiry callback once", () => {
    const onExpire = vi.fn();
    const expiresAt = new Date(Date.now() + 1000).toISOString(); // 1 second
    render(<HoldCountdown expiresAt={expiresAt} onExpire={onExpire} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1); // Still once
  });

  it("cleanup on unmount", () => {
    const onExpire = vi.fn();
    const expiresAt = new Date(Date.now() + 2000).toISOString();
    const { unmount } = render(<HoldCountdown expiresAt={expiresAt} onExpire={onExpire} />);
    
    unmount();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("no automatic release API call", () => {
    global.fetch = vi.fn();
    const expiresAt = new Date(Date.now() + 1000).toISOString();
    render(<HoldCountdown expiresAt={expiresAt} onExpire={vi.fn()} />);
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
