import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface EstateMediaFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "video" | "square" | "landscape" | "portrait" | "cinema";
}

export const EstateMediaFrame = React.forwardRef<HTMLDivElement, EstateMediaFrameProps>(
  ({ className, aspectRatio = "landscape", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-[var(--soe-color-stone)] rounded-[var(--soe-radius-media)]",
          {
            "aspect-video": aspectRatio === "video",
            "aspect-square": aspectRatio === "square",
            "aspect-[4/3]": aspectRatio === "landscape",
            "aspect-[3/4]": aspectRatio === "portrait",
            "aspect-[21/9]": aspectRatio === "cinema",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

EstateMediaFrame.displayName = "EstateMediaFrame";
