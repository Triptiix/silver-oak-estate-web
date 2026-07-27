import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EstateButton } from "@/components/estate-ui/estate-button";
import { EstateHeading } from "@/components/estate-ui/estate-heading";
import { EstateText } from "@/components/estate-ui/estate-text";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { EstateSection } from "@/components/estate-ui/estate-section";
import { EstateActionLink } from "@/components/estate-ui/estate-action-link";
import { EstateField } from "@/components/estate-ui/estate-field";
import { EstateMediaFrame } from "@/components/estate-ui/estate-media-frame";
import { EstateEyebrow } from "@/components/estate-ui/estate-eyebrow";
import { EstateStatCard } from "@/components/estate-ui/estate-stat-card";
import React from "react";

describe("Estate UI Primitives", () => {
  describe("EstateButton", () => {
    it("Defaults to type='button'", () => {
      render(<EstateButton>Click me</EstateButton>);
      expect(screen.getByRole("button", { name: "Click me" })).toHaveAttribute("type", "button");
    });

    it("Preserves type='submit'", () => {
      render(<EstateButton type="submit">Submit</EstateButton>);
      expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute("type", "submit");
    });

    it("Preserves type='reset'", () => {
      render(<EstateButton type="reset">Reset</EstateButton>);
      expect(screen.getByRole("button", { name: "Reset" })).toHaveAttribute("type", "reset");
    });

    it("Loading sets aria-busy='true'", () => {
      render(<EstateButton isLoading>Loading</EstateButton>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    it("Loading disables the button", () => {
      render(<EstateButton isLoading>Loading</EstateButton>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("Disabled state remains disabled", () => {
      render(<EstateButton disabled>Disabled</EstateButton>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("Loading content does not remove the accessible label", () => {
      render(<EstateButton isLoading>Accessible Content</EstateButton>);
      expect(screen.getByRole("button", { name: "Accessible Content" })).toBeInTheDocument();
    });

    it("Caller class extension still works", () => {
      render(<EstateButton className="custom-class">Custom</EstateButton>);
      expect(screen.getByRole("button", { name: "Custom" })).toHaveClass("custom-class");
    });

    it("Loading children appear exactly once in the DOM", () => {
      render(<EstateButton isLoading>UniqueTextChild</EstateButton>);
      const matches = screen.getAllByText("UniqueTextChild");
      expect(matches).toHaveLength(1);
    });

    it("Loading text span uses opacity-0 and does not use invisible", () => {
      render(<EstateButton isLoading>Loading Span Test</EstateButton>);
      const textSpan = screen.getByText("Loading Span Test");
      expect(textSpan).toHaveClass("opacity-0");
      expect(textSpan).not.toHaveClass("invisible");
    });

    it("isLoading=true cannot be overridden with unsafe caller aria-busy=false", () => {
      const unsafeProps = { "aria-busy": false };
      render(<EstateButton isLoading {...(unsafeProps as Record<string, unknown>)}>Click</EstateButton>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    it("isLoading=false does not expose aria-busy even when an unsafe caller attempts to set it", () => {
      const unsafeProps = { "aria-busy": true };
      render(<EstateButton isLoading={false} {...(unsafeProps as Record<string, unknown>)}>Click</EstateButton>);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
    });
  });

  describe("EstateHeading", () => {
    it("Hero uses --soe-leading-display-tight and --soe-tracking-display", () => {
      render(<EstateHeading variant="hero">Hero Heading</EstateHeading>);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("leading-[var(--soe-leading-display-tight)]");
      expect(heading).toHaveClass("tracking-[var(--soe-tracking-display)]");
    });

    it("Normal heading variant uses --soe-leading-heading and --soe-tracking-heading", () => {
      render(<EstateHeading variant="h1">H1 Heading</EstateHeading>);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("leading-[var(--soe-leading-heading)]");
      expect(heading).toHaveClass("tracking-[var(--soe-tracking-heading)]");
    });

    it("Heading output does not contain tracking-tight or numeric hard-coded line-height classes", () => {
      render(<EstateHeading variant="h2">H2 Heading</EstateHeading>);
      const heading = screen.getByRole("heading");
      const className = heading.getAttribute("class") || "";
      expect(className).not.toContain("tracking-tight");
      expect(className).not.toMatch(/leading-\[\d+(\.\d+)?\]/);
    });
  });

  describe("EstateText", () => {
    it("Uses --soe-leading-body", () => {
      render(<EstateText>Body Text</EstateText>);
      const text = screen.getByText("Body Text");
      expect(text).toHaveClass("leading-[var(--soe-leading-body)]");
    });

    it("Does not use leading-relaxed", () => {
      render(<EstateText>Body Text</EstateText>);
      const text = screen.getByText("Body Text");
      expect(text).not.toHaveClass("leading-relaxed");
    });
  });

  describe("EstateField", () => {
    it("Label htmlFor equals control id", () => {
      render(
        <EstateField id="test-field" label="Test Label">
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByText("Test Label")).toHaveAttribute("for", "test-field");
      expect(screen.getByTestId("input")).toHaveAttribute("id", "test-field");
    });

    it("Description ID is included in aria-describedby", () => {
      render(
        <EstateField id="desc-field" label="Desc" description="A description">
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByTestId("input")).toHaveAttribute("aria-describedby", "desc-field-description");
      expect(screen.getByText("A description")).toHaveAttribute("id", "desc-field-description");
    });

    it("Error ID is included in aria-describedby", () => {
      render(
        <EstateField id="err-field" label="Err" error="An error">
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByTestId("input")).toHaveAttribute("aria-describedby", "err-field-error");
      expect(screen.getByText("An error")).toHaveAttribute("id", "err-field-error");
    });

    it("Both IDs are included when description and error both exist", () => {
      render(
        <EstateField id="both-field" label="Both" description="A description" error="An error">
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      const describedBy = screen.getByTestId("input").getAttribute("aria-describedby");
      expect(describedBy).toContain("both-field-error");
      expect(describedBy).toContain("both-field-description");
      expect(screen.getByText("A description")).toBeInTheDocument();
      expect(screen.getByText("An error")).toBeInTheDocument();
    });

    it("No empty aria-describedby", () => {
      render(
        <EstateField id="empty-field" label="Empty">
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByTestId("input")).not.toHaveAttribute("aria-describedby");
    });

    it("Error sets aria-invalid", () => {
      render(
        <EstateField id="inv-field" label="Inv" error="Err">
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByTestId("input")).toHaveAttribute("aria-invalid", "true");
    });

    it("Required sets aria-required", () => {
      render(
        <EstateField id="req-field" label="Req" required>
          {(props) => <input {...props} data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByTestId("input")).toHaveAttribute("aria-required", "true");
    });

    it("Caller-provided accessible attributes are not silently corrupted", () => {
      render(
        <EstateField id="custom-field" label="Custom" description="Desc">
          {(props) => <input {...props} aria-hidden="true" data-testid="input" />}
        </EstateField>
      );
      expect(screen.getByTestId("input")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId("input")).toHaveAttribute("aria-describedby", "custom-field-description");
    });

    it("Multiple fields on one page do not generate duplicate IDs", () => {
      render(
        <>
          <EstateField id="f1" label="F1" description="D1">{(p) => <input {...p} data-testid="i1" />}</EstateField>
          <EstateField id="f2" label="F2" description="D2">{(p) => <input {...p} data-testid="i2" />}</EstateField>
        </>
      );
      expect(screen.getByTestId("i1")).toHaveAttribute("aria-describedby", "f1-description");
      expect(screen.getByTestId("i2")).toHaveAttribute("aria-describedby", "f2-description");
    });

    it("EstateField required marker uses --soe-surface-color-error", () => {
      render(
        <EstateField id="req-marker" label="Req" required>
          {(props) => <input {...props} />}
        </EstateField>
      );
      const asterisk = screen.getByText("*");
      expect(asterisk).toHaveClass("text-[var(--soe-surface-color-error)]");
    });

    it("EstateField error message uses --soe-surface-color-error", () => {
      render(
        <EstateField id="err-msg" label="Err" error="Validation error">
          {(props) => <input {...props} />}
        </EstateField>
      );
      const errorMsg = screen.getByText("Validation error");
      expect(errorMsg).toHaveClass("text-[var(--soe-surface-color-error)]");
    });

    it("An error paragraph has role='alert'", () => {
      render(
        <EstateField id="alert-field" label="Alert Label" error="Alert error message">
          {(props) => <input {...props} />}
        </EstateField>
      );
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Alert error message");
      expect(alert).toHaveAttribute("id", "alert-field-error");
    });

    it("The control's aria-describedby still includes the error ID when error exists", () => {
      render(
        <EstateField id="alert-ctrl-field" label="Label" error="Control error message">
          {(props) => <input {...props} data-testid="ctrl-input" />}
        </EstateField>
      );
      expect(screen.getByTestId("ctrl-input")).toHaveAttribute("aria-describedby", "alert-ctrl-field-error");
    });

    it("No alert exists when no error is supplied", () => {
      render(
        <EstateField id="no-alert-field" label="No Alert Label">
          {(props) => <input {...props} />}
        </EstateField>
      );
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("Surface and focus contract", () => {
    it("Light theme attribute sets appropriate classes", () => {
      render(<EstateSection surface="light" data-testid="light-sec" />);
      expect(screen.getByTestId("light-sec")).toHaveAttribute("data-estate-theme", "light");
      expect(screen.getByTestId("light-sec")).toHaveClass("bg-[var(--soe-surface-bg-primary)]");
    });

    it("Dark theme attribute sets appropriate classes", () => {
      render(<EstateSection surface="dark" data-testid="dark-sec" />);
      expect(screen.getByTestId("dark-sec")).toHaveAttribute("data-estate-theme", "dark");
      expect(screen.getByTestId("dark-sec")).toHaveClass("bg-[var(--soe-surface-bg-primary)]");
    });

    it("Transparent surface behaviour removes theme and background", () => {
      render(<EstateSection surface="transparent" data-testid="trans-sec" />);
      expect(screen.getByTestId("trans-sec")).not.toHaveAttribute("data-estate-theme");
      expect(screen.getByTestId("trans-sec")).not.toHaveClass("bg-[var(--soe-surface-bg-primary)]");
    });

    it("surface='light' cannot be overridden by unsafe caller data-estate-theme='dark'", () => {
      const unsafeProps = { "data-estate-theme": "dark" };
      render(<EstateSection surface="light" data-testid="sec-override" {...(unsafeProps as Record<string, unknown>)} />);
      expect(screen.getByTestId("sec-override")).toHaveAttribute("data-estate-theme", "light");
    });

    it("surface='dark' produces data-estate-theme='dark'", () => {
      render(<EstateSection surface="dark" data-testid="sec-dark-prod" />);
      expect(screen.getByTestId("sec-dark-prod")).toHaveAttribute("data-estate-theme", "dark");
    });

    it("surface='transparent' removes an unsafe caller data-estate-theme value", () => {
      const unsafeProps = { "data-estate-theme": "dark" };
      render(<EstateSection surface="transparent" data-testid="sec-trans-override" {...(unsafeProps as Record<string, unknown>)} />);
      expect(screen.getByTestId("sec-trans-override")).not.toHaveAttribute("data-estate-theme");
    });

    it("Rejects as='main' at compile time", () => {
      // @ts-expect-error as='main' is removed from allowed element types in EstateSection
      render(<EstateSection as="main" data-testid="sec-main" />);
      expect(screen.getByTestId("sec-main")).toBeInTheDocument();
    });

    it("Dark-theme focus token mapping and surface-aware focus offset mapping are applied to Button", () => {
      render(<EstateButton data-testid="btn" />);
      expect(screen.getByTestId("btn")).toHaveClass("focus-visible:ring-offset-[var(--soe-color-focus-offset)]");
      expect(screen.getByTestId("btn")).toHaveClass("focus-visible:ring-[var(--soe-color-focus-ring)]");
    });
  });

  it("EstateHeading renders correct elements", () => {
    const { rerender } = render(<EstateHeading as="h1">Heading 1</EstateHeading>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    rerender(<EstateHeading as="h3">Heading 3</EstateHeading>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("EstateText renders correctly", () => {
    render(<EstateText>Some text</EstateText>);
    expect(screen.getByText("Some text")).toBeInTheDocument();
  });

  it("EstateContainer renders correctly", () => {
    render(<EstateContainer data-testid="container">Container content</EstateContainer>);
    expect(screen.getByTestId("container")).toHaveClass("mx-auto");
  });

  it("EstateActionLink renders correctly", () => {
    render(<EstateActionLink href="/test">Link</EstateActionLink>);
    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("href", "/test");
  });

  it("EstateMediaFrame renders correctly", () => {
    render(<EstateMediaFrame data-testid="media">Media</EstateMediaFrame>);
    expect(screen.getByTestId("media")).toHaveClass("relative");
  });

  describe("EstateEyebrow", () => {
    it("Renders a paragraph element", () => {
      render(<EstateEyebrow data-testid="eyebrow">OVERVIEW</EstateEyebrow>);
      const el = screen.getByTestId("eyebrow");
      expect(el.tagName).toBe("P");
    });

    it("Preserves children", () => {
      render(<EstateEyebrow>OVERVIEW TEST</EstateEyebrow>);
      expect(screen.getByText("OVERVIEW TEST")).toBeInTheDocument();
    });

    it("Applies common Estate eyebrow classes", () => {
      render(<EstateEyebrow data-testid="eyebrow">EYEBROW</EstateEyebrow>);
      const el = screen.getByTestId("eyebrow");
      expect(el).toHaveClass("font-soe-ui");
      expect(el).toHaveClass("text-[length:var(--soe-text-xs)]");
      expect(el).toHaveClass("font-semibold");
      expect(el).toHaveClass("tracking-[var(--soe-tracking-eyebrow)]");
      expect(el).toHaveClass("uppercase");
    });

    it("Allows caller colour and margin classes", () => {
      render(<EstateEyebrow className="text-[var(--soe-color-brand)] mb-2" data-testid="eyebrow">CUSTOM</EstateEyebrow>);
      const el = screen.getByTestId("eyebrow");
      expect(el).toHaveClass("text-[var(--soe-color-brand)]");
      expect(el).toHaveClass("mb-2");
    });

    it("Forwards standard paragraph attributes", () => {
      render(<EstateEyebrow id="eyebrow-id" aria-label="custom-eyebrow">ACCESSIBLE</EstateEyebrow>);
      const el = screen.getByText("ACCESSIBLE");
      expect(el).toHaveAttribute("id", "eyebrow-id");
      expect(el).toHaveAttribute("aria-label", "custom-eyebrow");
    });
  });

  describe("EstateStatCard", () => {
    it("Overview variant renders label, value and description", () => {
      render(
        <EstateStatCard
          label="Residence"
          value="Fully furnished 3 BHK"
          description="Three themed king-bed bedrooms"
        />
      );
      expect(screen.getByText("Residence")).toBeInTheDocument();
      expect(screen.getByText("Fully furnished 3 BHK")).toBeInTheDocument();
      expect(screen.getByText("Three themed king-bed bedrooms")).toBeInTheDocument();
    });

    it("Overview variant uses the card radius and overview typography", () => {
      render(
        <EstateStatCard
          data-testid="stat-card"
          label="Residence"
          value="3 BHK"
          description="Description"
        />
      );
      const card = screen.getByTestId("stat-card");
      expect(card).toHaveClass("rounded-[var(--soe-radius-card)]");
      expect(card).toHaveClass("space-y-2");
      expect(screen.getByText("3 BHK")).toHaveClass("text-[length:var(--soe-text-xl)]");
      expect(screen.getByText("Description")).toHaveClass("text-[length:var(--soe-text-sm)]");
    });

    it("Capacity variant uses the control radius and capacity typography", () => {
      render(
        <EstateStatCard
          variant="capacity"
          data-testid="stat-card-cap"
          label="Overnight Stays"
          value="6–10 Guests"
          description="Full house"
        />
      );
      const card = screen.getByTestId("stat-card-cap");
      expect(card).toHaveClass("rounded-[var(--soe-radius-control)]");
      expect(screen.getByText("6–10 Guests")).toHaveClass("text-[length:var(--soe-text-2xl)]");
      expect(screen.getByText("Full house")).toHaveClass("text-[length:var(--soe-text-xs)]");
    });

    it("Caller class extension is preserved", () => {
      render(
        <EstateStatCard
          className="custom-stat-class"
          data-testid="stat-card-custom"
          label="Label"
          value="Value"
          description="Desc"
        />
      );
      expect(screen.getByTestId("stat-card-custom")).toHaveClass("custom-stat-class");
    });
  });
});
