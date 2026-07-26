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
          "inline-flex items-center justify-center min-h-[48px] rounded-[var(--soe-radius-control)] px-6 py-3 font-soe-ui text-[length:var(--soe-text-base)] font-medium transition-colors duration-[var(--soe-duration-interface)] ease-[var(--soe-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)] disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[var(--soe-surface-action-primary)] text-[var(--soe-surface-text-inverse)] hover:bg-[var(--soe-surface-action-hover)]":
              variant === "primary",
            "bg-[var(--soe-surface-action-secondary)] text-[var(--soe-surface-text-primary)] border border-[var(--soe-surface-control-border)] hover:bg-[var(--soe-surface-action-secondary-hover)]":
              variant === "secondary",
            "bg-transparent text-[var(--soe-surface-text-primary)] hover:bg-[var(--soe-surface-action-quiet-hover)]":
              variant === "quiet",
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="grid place-items-center">
            <span className="invisible col-start-1 row-start-1" aria-hidden="true">
              {children}
            </span>
            <span className="col-start-1 row-start-1 flex items-center gap-2">
              <span className="h-4 w-4 animate-spin motion-reduce:animate-none rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              <span>{children}</span>
            </span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

EstateButton.displayName = "EstateButton";
