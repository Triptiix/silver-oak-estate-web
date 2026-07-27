import { cn } from "@/lib/utils/cn";
import * as React from "react";

export type EstateEyebrowProps = React.HTMLAttributes<HTMLParagraphElement>;

export function EstateEyebrow({ className, children, ...props }: EstateEyebrowProps) {
  return (
    <p
      className={cn(
        "font-soe-ui text-[length:var(--soe-text-xs)] font-semibold tracking-[var(--soe-tracking-eyebrow)] uppercase",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
