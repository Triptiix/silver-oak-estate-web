import { cn } from "@/lib/utils/cn";
import * as React from "react";

interface EstateSectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article" | "aside";
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
      {...props}
      data-estate-theme={surface !== "transparent" ? surface : undefined}
      className={cn(
        "w-full transition-colors duration-[var(--soe-duration-editorial)]",
        {
          "py-[var(--soe-section-space-sm)]": spacing === "sm",
          "py-[var(--soe-section-space-md)]": spacing === "md",
          "py-[var(--soe-section-space-lg)]": spacing === "lg",
          "bg-[var(--soe-surface-bg-primary)]": surface !== "transparent",
        },
        className
      )}
    />
  );
}
