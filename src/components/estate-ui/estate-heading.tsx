import { cn } from "@/lib/utils/cn";
import * as React from "react";

interface EstateHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  variant?: "hero" | "h1" | "h2" | "h3" | "h4";
  readable?: boolean;
}

export function EstateHeading({
  as: Component = "h2",
  variant = "h2",
  readable = false,
  className,
  ...props
}: EstateHeadingProps) {
  return (
    <Component
      className={cn(
        "font-soe-display text-[var(--soe-surface-text-primary)] tracking-tight",
        {
          "text-[length:var(--soe-text-hero)] leading-[1.1]": variant === "hero",
          "text-[length:var(--soe-text-3xl)] leading-[1.15]": variant === "h1",
          "text-[length:var(--soe-text-2xl)] leading-[1.2]": variant === "h2",
          "text-[length:var(--soe-text-xl)] leading-[1.25]": variant === "h3",
          "text-[length:var(--soe-text-lg)] leading-[1.3]": variant === "h4",
          "max-w-[var(--soe-container-reading)]": readable,
        },
        className
      )}
      {...props}
    />
  );
}
