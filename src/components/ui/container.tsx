import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--container-width)] px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    />
  );
}
