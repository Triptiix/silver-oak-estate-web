import * as React from "react";
import Link, { LinkProps } from "next/link";
import { cn } from "@/lib/utils/cn";

export interface EstateActionLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  variant?: "editorial" | "button";
  icon?: React.ReactNode;
}

export const EstateActionLink = React.forwardRef<HTMLAnchorElement, EstateActionLinkProps>(
  ({ className, variant = "editorial", icon, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 transition-all duration-[200ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]",
          {
            "font-display text-[length:var(--soe-text-lg)] text-[var(--soe-color-text-primary)] hover:opacity-80 underline underline-offset-4 decoration-1":
              variant === "editorial",
            "min-h-[48px] justify-center rounded-[var(--soe-space-2)] px-6 py-3 font-ui text-[length:var(--soe-text-base)] font-medium bg-[var(--soe-color-action-primary)] text-white hover:bg-[var(--soe-color-action-primary-hover)]":
              variant === "button",
          },
          className
        )}
        {...props}
      >
        {children}
        {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      </Link>
    );
  }
);

EstateActionLink.displayName = "EstateActionLink";
