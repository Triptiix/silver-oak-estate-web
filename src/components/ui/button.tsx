import { cn } from "@/lib/utils/cn";
import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-[var(--background)] h-10 py-2 px-4",
          {
            "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90": variant === "primary",
            "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/80": variant === "secondary",
            "border border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]": variant === "outline",
            "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]": variant === "ghost",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
