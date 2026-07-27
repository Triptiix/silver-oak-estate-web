import { cn } from "@/lib/utils/cn";
import * as React from "react";

interface EstateTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "base" | "sm" | "xs" | "lg";
  tone?: "primary" | "muted";
  readable?: boolean;
}

export function EstateText({
  variant = "base",
  tone = "primary",
  readable = false,
  className,
  ...props
}: EstateTextProps) {
  return (
    <p
      className={cn(
        "font-soe-body",
        {
          "text-[length:var(--soe-text-base)]": variant === "base",
          "text-[length:var(--soe-text-sm)]": variant === "sm",
          "text-[length:var(--soe-text-xs)]": variant === "xs",
          "text-[length:var(--soe-text-lg)]": variant === "lg",
          "text-[var(--soe-surface-text-primary)]": tone === "primary",
          "text-[var(--soe-surface-text-secondary)]": tone === "muted",
          "max-w-[var(--soe-container-reading)]": readable,
        },
        "leading-[var(--soe-leading-body)]",
        className
      )}
      {...props}
    />
  );
}
