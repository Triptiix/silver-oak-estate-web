import { cn } from "@/lib/utils/cn";
import * as React from "react";

interface EstateContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "visual" | "content" | "reading";
}

export function EstateContainer({
  variant = "content",
  className,
  ...props
}: EstateContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        {
          "max-w-[var(--soe-container-visual)]": variant === "visual",
          "max-w-[var(--soe-container-content)]": variant === "content",
          "max-w-[var(--soe-container-reading)]": variant === "reading",
        },
        className
      )}
      {...props}
    />
  );
}
