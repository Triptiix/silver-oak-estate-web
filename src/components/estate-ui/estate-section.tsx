import { cn } from "@/lib/utils/cn";
import * as React from "react";

interface EstateSectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  spacing?: "sm" | "md" | "lg" | "none";
  surface?: "light" | "dark" | "transparent";
}

export function EstateSection({
  as: Component = "section",
  spacing = "md",
  surface = "transparent",
  className,
  ...props
}: EstateSectionProps) {
  return (
    <Component
      data-estate-theme={surface !== "transparent" ? surface : undefined}
      className={cn(
        "w-full transition-colors duration-[var(--soe-motion-editorial)]",
        {
          "py-[var(--soe-space-12)] md:py-[var(--soe-space-16)]": spacing === "sm",
          "py-[var(--soe-space-16)] md:py-[var(--soe-space-24)]": spacing === "md",
          "py-[var(--soe-space-20)] md:py-[var(--soe-space-32)]": spacing === "lg",
          "bg-[var(--soe-surface-bg-primary)]": surface !== "transparent",
        },
        className
      )}
      {...props}
    />
  );
}
