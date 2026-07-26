import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface EstateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet";
  isLoading?: boolean;
}

export const EstateButton = React.forwardRef<HTMLButtonElement, EstateButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, type = "button", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center min-h-[48px] rounded-[var(--soe-space-2)] px-6 py-3 font-ui text-[length:var(--soe-text-base)] font-medium transition-all duration-[200ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)] disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[var(--soe-color-action-primary)] text-white hover:bg-[var(--soe-color-action-primary-hover)]":
              variant === "primary",
            "bg-[var(--soe-color-surface)] text-[var(--soe-color-text-primary)] border border-[var(--soe-color-control-border)] hover:bg-[var(--soe-color-canvas)]":
              variant === "secondary",
            "bg-transparent text-[var(--soe-color-text-primary)] hover:bg-[var(--soe-color-canvas)]":
              variant === "quiet",
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="opacity-0" aria-hidden="true">{children}</span>
            <span className="absolute">{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

EstateButton.displayName = "EstateButton";
