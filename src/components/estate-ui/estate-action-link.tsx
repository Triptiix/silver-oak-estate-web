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
          "inline-flex items-center gap-2 transition-colors duration-[var(--soe-duration-interface)] ease-[var(--soe-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]",
          {
            "font-soe-display text-[length:var(--soe-text-lg)] text-[var(--soe-surface-text-primary)] hover:opacity-80 underline underline-offset-4 decoration-1":
              variant === "editorial",
            "min-h-[48px] justify-center rounded-[var(--soe-radius-control)] px-6 py-3 font-soe-ui text-[length:var(--soe-text-base)] font-medium bg-[var(--soe-surface-action-primary)] text-[var(--soe-surface-text-inverse)] hover:bg-[var(--soe-surface-action-hover)]":
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
