import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReleaseHoldDialog } from "../../../src/components/booking/release-hold-dialog";

describe("ReleaseHoldDialog", () => {
  beforeEach(() => {
    // Mock dialog methods not fully supported in jsdom
    HTMLDialogElement.prototype.showModal = function() {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function() {
      this.open = false;
    };
  });

  it("does not render contents if not open", () => {
    render(
      <ReleaseHoldDialog
        isOpen={false}
        isReleasing={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText("Release Hold?")).not.toBeInTheDocument();
  });

  it("renders correctly when open", () => {
    render(
      <ReleaseHoldDialog
        isOpen={true}
        isReleasing={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("Release Hold?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Release Hold" })).toBeInTheDocument();
  });

  it("disables buttons and updates text when releasing", () => {
    render(
      <ReleaseHoldDialog
        isOpen={true}
        isReleasing={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Releasing..." })).toBeDisabled();
  });

  it("calls onConfirm when release button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ReleaseHoldDialog
        isOpen={true}
        isReleasing={false}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Release Hold" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ReleaseHoldDialog
        isOpen={true}
        isReleasing={false}
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("displays error message when error is provided", () => {
    render(
      <ReleaseHoldDialog
        isOpen={true}
        isReleasing={false}
        onConfirm={() => {}}
        onCancel={() => {}}
        error="Test error message"
      />
    );
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });
});
