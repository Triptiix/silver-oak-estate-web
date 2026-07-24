import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TurnstileWidget } from "../../../src/components/booking/turnstile-widget";

describe("TurnstileWidget", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.turnstile = {
      render: vi.fn(() => "widget-123"),
      reset: vi.fn(),
      remove: vi.fn(),
    };
  });

  afterEach(() => {
    delete (window as { turnstile?: unknown }).turnstile;
    delete window.onSoeTurnstileLoad;
  });

  it("initial resetSignal does not reset", () => {
    render(<TurnstileWidget onVerify={vi.fn()} resetSignal={0} />);
    expect(window.turnstile?.reset).not.toHaveBeenCalled();
  });

  it("later signal changes reset the real widget", () => {
    const onVerify = vi.fn();
    const { rerender } = render(<TurnstileWidget onVerify={onVerify} resetSignal={0} />);
    
    rerender(<TurnstileWidget onVerify={onVerify} resetSignal={1} />);
    expect(window.turnstile?.reset).toHaveBeenCalledWith("widget-123");
    expect(onVerify).toHaveBeenCalledWith("");
  });

  it("expired/error callbacks clear the token", () => {
    const onVerify = vi.fn();
    render(<TurnstileWidget onVerify={onVerify} resetSignal={0} />);
    
    // @ts-expect-error mock
    const renderArgs = window.turnstile?.render.mock.calls[0][1];
    
    renderArgs["expired-callback"]();
    expect(onVerify).toHaveBeenCalledWith("");
    
    renderArgs["error-callback"]();
    expect(onVerify).toHaveBeenCalledWith("");
  });

  it("unmount calls window.turnstile.remove exactly once", () => {
    const { unmount } = render(<TurnstileWidget onVerify={vi.fn()} resetSignal={0} />);
    unmount();
    expect(window.turnstile?.remove).toHaveBeenCalledTimes(1);
    expect(window.turnstile?.remove).toHaveBeenCalledWith("widget-123");
  });

  it("owned global load callback is removed on unmount", () => {
    delete (window as { turnstile?: unknown }).turnstile; // Simulate late load
    const { unmount } = render(<TurnstileWidget onVerify={vi.fn()} resetSignal={0} />);
    
    expect(window.onSoeTurnstileLoad).toBeDefined();
    unmount();
    expect(window.onSoeTurnstileLoad).toBeUndefined();
  });
});
