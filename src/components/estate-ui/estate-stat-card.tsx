import { cn } from "@/lib/utils/cn";
import * as React from "react";

export interface EstateStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  description: React.ReactNode;
  variant?: "overview" | "capacity";
}

export function EstateStatCard({
  label,
  value,
  description,
  variant = "overview",
  className,
  ...props
}: EstateStatCardProps) {
  const isOverview = variant === "overview";

  return (
    <div
      className={cn(
        "p-6 bg-[var(--soe-surface-bg-surface)] border border-[var(--soe-surface-control-border)]/20",
        isOverview ? "rounded-[var(--soe-radius-card)] space-y-2" : "rounded-[var(--soe-radius-control)]",
        className
      )}
      {...props}
    >
      <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase text-[var(--soe-color-brand)]">
        {label}
      </p>
      <p
        className={cn(
          "font-soe-display text-[var(--soe-surface-text-primary)]",
          isOverview
            ? "text-[length:var(--soe-text-xl)] font-semibold"
            : "text-[length:var(--soe-text-2xl)] font-bold mt-1"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "text-[var(--soe-surface-text-secondary)]",
          isOverview ? "text-[length:var(--soe-text-sm)]" : "text-[length:var(--soe-text-xs)] mt-1"
        )}
      >
        {description}
      </p>
    </div>
  );
}
